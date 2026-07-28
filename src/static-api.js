import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const STORAGE_KEY = "cpms-pages-database-v1";
let databasePromise;

function rows(result) {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index]])));
}

function query(database, sql, params = []) {
  return rows(database.exec(sql, params));
}

function one(database, sql, params = []) {
  return query(database, sql, params)[0] ?? null;
}

function encode(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function decode(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = (async () => {
      const SQL = await initSqlJs({ locateFile: () => sqlWasmUrl });
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return new SQL.Database(decode(saved));
        } catch (error) {
          console.warn("The saved browser database was invalid; loading the published demo database.", error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      const response = await fetch(`${import.meta.env.BASE_URL}portfolio.sqlite`);
      if (!response.ok) throw new Error("Unable to load the published portfolio database.");
      return new SQL.Database(new Uint8Array(await response.arrayBuffer()));
    })();
  }
  return databasePromise;
}

function save(database) {
  try {
    localStorage.setItem(STORAGE_KEY, encode(database.export()));
  } catch (error) {
    console.warn("Browser storage is unavailable; changes will last only until this page is refreshed.", error);
  }
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function engagementPayload(database, engagementId) {
  const engagement = one(database, "SELECT * FROM engagements WHERE id=?", [engagementId]);
  if (!engagement) throw new Error(`Portfolio ${engagementId} was not found.`);
  const systems = one(database, "SELECT * FROM systems_landscape WHERE engagement_id=?", [engagementId]);
  const processZones = query(database, `
    SELECT p.*, ep.current_maturity, ep.target_maturity, ep.health_score, ep.operating_pattern, ep.ai_enablers
    FROM process_zones p
    JOIN engagement_process_zones ep ON ep.process_zone_id=p.id
    WHERE ep.engagement_id=?
    ORDER BY p.rowid
  `, [engagementId]);
  const metrics = query(database, "SELECT * FROM kpi_metrics WHERE engagement_id=? ORDER BY rowid", [engagementId]);
  const tasks = query(database, "SELECT * FROM task_actions WHERE engagement_id=? ORDER BY due_date", [engagementId]);
  const notifications = query(database, "SELECT * FROM notifications WHERE engagement_id=? ORDER BY created_at DESC", [engagementId]);
  const kpiComments = query(database, "SELECT * FROM kpi_comments WHERE engagement_id=? ORDER BY created_at DESC", [engagementId]);
  const agileItems = query(database, "SELECT * FROM agile_items WHERE engagement_id=? ORDER BY type, rowid", [engagementId]);
  const portfolioHealth = Math.round(processZones.reduce((sum, zone) => sum + Number(zone.health_score || 0), 0) / Math.max(processZones.length, 1));
  return { engagement, systems, processZones, metrics, tasks, notifications, kpiComments, agileItems, portfolioHealth };
}

function portfolioPayload(database, engagementId) {
  return {
    sponsors: query(database, "SELECT * FROM sponsors WHERE engagement_id=? ORDER BY risk_score DESC", [engagementId]),
    studies: query(database, "SELECT * FROM studies WHERE engagement_id=? ORDER BY status DESC, completion_date", [engagementId]),
    fspRequirements: query(database, "SELECT * FROM fsp_requirements WHERE engagement_id=? ORDER BY status, start_date", [engagementId]),
    source: "Published mock portfolio data (browser-local demo)",
  };
}

async function get(path) {
  const database = await getDatabase();
  if (path === "/api/bootstrap") {
    return {
      engagements: query(database, "SELECT * FROM engagements ORDER BY updated_at DESC"),
      zones: query(database, "SELECT * FROM process_zones ORDER BY rowid"),
    };
  }

  let match = path.match(/^\/api\/engagements\/([^/]+)$/);
  if (match) return engagementPayload(database, decodeURIComponent(match[1]));

  match = path.match(/^\/api\/portfolio\/([^/]+)\/zones\/([^/]+)\/details$/);
  if (match) {
    const engagementId = decodeURIComponent(match[1]);
    const zoneId = decodeURIComponent(match[2]);
    const zone = one(database, "SELECT name FROM process_zones WHERE id=?", [zoneId]);
    return {
      studies: query(database, "SELECT * FROM studies WHERE engagement_id=? AND process_zone_signal=? ORDER BY status, completion_date", [engagementId, zone?.name || ""]),
      fspRequirements: query(database, "SELECT * FROM fsp_requirements WHERE engagement_id=? AND process_zone_signal=? ORDER BY status, start_date", [engagementId, zone?.name || ""]),
      tasks: query(database, "SELECT * FROM task_actions WHERE engagement_id=? AND process_zone_id=? ORDER BY due_date", [engagementId, zoneId]),
      comments: query(database, "SELECT * FROM kpi_comments WHERE engagement_id=? AND process_zone_id=? ORDER BY created_at DESC", [engagementId, zoneId]),
    };
  }

  match = path.match(/^\/api\/portfolio\/([^/]+)$/);
  if (match) return portfolioPayload(database, decodeURIComponent(match[1]));
  throw new Error(`Static GET route ${path} is not implemented.`);
}

async function post(path, body = {}) {
  const database = await getDatabase();
  const now = new Date().toISOString();

  if (path === "/api/auth/login") {
    const email = body.email || "organizer@rrdigital.local";
    let user = one(database, "SELECT * FROM users WHERE email=?", [email]);
    if (!user) {
      user = { id: id("user"), name: body.name || email.split("@")[0], email, role: "Organizer", auth_provider: "browser-local", created_at: now };
      database.run("INSERT INTO users (id,name,email,role,auth_provider,created_at) VALUES (?,?,?,?,?,?)", Object.values(user));
      save(database);
    }
    return { user };
  }

  if (path === "/api/engagements") {
    const engagementId = id("eng");
    database.run(`INSERT INTO engagements (id,name,description,owner_user_id,model_type,status,sponsor_label,brand_primary,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`, [engagementId, body.name || "New Hybrid Portfolio Engagement", body.description || "New browser-local prototype portfolio.", "user-org-1", body.modelType || "Hybrid FSO/FSP", "Draft", body.sponsorLabel || "New sponsor portfolio", body.brandPrimary || "#2563eb", now, now]);
    database.run(`INSERT INTO systems_landscape (id,engagement_id,crm_system,pricing_tools,contract_repository,resource_management_system,hr_talent_system,finance_systems,project_tools,bi_tools,document_repository,collaboration_tools,data_lake_available,notes)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id("sys"), engagementId, body.crmSystem || "", body.pricingTools || "", body.contractRepository || "", body.resourceManagementSystem || "", body.hrTalentSystem || "", body.financeSystems || "", body.projectTools || "", body.biTools || "", body.documentRepository || "", body.collaborationTools || "", body.dataLakeAvailable ? 1 : 0, body.notes || ""]);
    for (const zone of query(database, "SELECT id FROM process_zones")) {
      database.run(`INSERT INTO engagement_process_zones (id,engagement_id,process_zone_id,current_maturity,target_maturity,health_score,operating_pattern,ai_enablers)
        VALUES (?,?,?,?,?,?,?,?)`, [id("epz"), engagementId, zone.id, 1, 3, 50, JSON.stringify(["Capture baseline", "Map system handoffs", "Define KPIs", "Prioritize requirements"]), JSON.stringify(["AI search placeholder", "Workflow copilot candidate"])]);
    }
    save(database);
    return engagementPayload(database, engagementId);
  }

  if (path === "/api/contact") {
    const emailId = id("email");
    database.run("INSERT INTO email_outbox (id,engagement_id,recipient_email,subject,body,status,created_at) VALUES (?,?,?,?,?,?,?)", [emailId, "contact-us", "contact@strathub360.com", `Contact request from ${body.email || "web app visitor"}`, String(body.message || ""), "Saved in this browser - no email service configured", now]);
    save(database);
    return { ok: true, email: { id: emailId, recipient: "contact@strathub360.com", status: "Saved locally" } };
  }

  if (path === "/api/kpi-comments") {
    const commentId = id("kpic");
    database.run(`INSERT INTO kpi_comments (id,engagement_id,process_zone_id,metric_id,metric_name,comment_text,author,assignee_email,status,created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)`, [commentId, body.engagementId, body.processZoneId || "", body.metricId, body.metricName, body.commentText, body.author || "Organizer", body.assigneeEmail || "", body.assigneeEmail ? "Assigned locally" : "Saved", now]);
    let email = null;
    if (body.assigneeEmail) {
      const emailId = id("email");
      database.run("INSERT INTO email_outbox (id,engagement_id,recipient_email,subject,body,status,created_at) VALUES (?,?,?,?,?,?,?)", [emailId, body.engagementId, body.assigneeEmail, `Portfolio KPI comment assigned: ${body.metricName}`, body.commentText, "Saved in this browser - no email service configured", now]);
      email = { id: emailId, status: "Saved locally" };
    }
    save(database);
    return { ok: true, commentId, email };
  }

  if (path === "/api/ai-search") {
    const question = String(body.question || "").toLowerCase();
    let answer = "The mock AI agent can answer from seeded portfolio context. Try asking about scope drift, resources, finance, or contract readiness.";
    if (question.includes("scope")) answer = "There are 7 scope-drift alerts. Review uncovered work in Oversight & Scope Changes and convert approved drift into change-control tasks.";
    if (question.includes("finance") || question.includes("revenue")) answer = "Revenue-routing accuracy is 99%, while forecast accuracy is 92% against a 95% target.";
    if (question.includes("resource") || question.includes("allocation")) answer = "Resource Management shows 90% demand conversion accuracy and 85% resource fit. The main open action is resolving shared-resource variance.";
    if (question.includes("contract")) answer = "Contract load readiness is 98%, but scope boundary decisions should stay under 3 days to avoid downstream leakage.";
    return { answer, citations: ["Published KPIs", "Open tasks", "Process-zone dashboard"] };
  }

  throw new Error(`Static POST route ${path} is not implemented.`);
}

export function createStaticApi() {
  return { get, post };
}
