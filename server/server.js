const express = require("express");
const cors = require("cors");
const path = require("path");
const { zipSync, strToU8 } = require("fflate");
const { all, one, run, q, seedAgile } = require("./db");

const app = express();
const port = process.env.PORT || 4317;
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function engagementPayload(engagementId) {
  const engagement = await one(`SELECT * FROM engagements WHERE id='${q(engagementId)}'`);
  const systems = await one(`SELECT * FROM systems_landscape WHERE engagement_id='${q(engagementId)}'`);
  const processZones = await all(`
    SELECT p.*, ep.current_maturity, ep.target_maturity, ep.health_score, ep.operating_pattern, ep.ai_enablers
    FROM process_zones p
    JOIN engagement_process_zones ep ON ep.process_zone_id=p.id
    WHERE ep.engagement_id='${q(engagementId)}'
    ORDER BY p.rowid
  `);
  const metrics = await all(`SELECT * FROM kpi_metrics WHERE engagement_id='${q(engagementId)}' ORDER BY rowid`);
  const tasks = await all(`SELECT * FROM task_actions WHERE engagement_id='${q(engagementId)}' ORDER BY due_date`);
  const notifications = await all(`SELECT * FROM notifications WHERE engagement_id='${q(engagementId)}' ORDER BY created_at DESC`);
  const kpiComments = await all(`SELECT * FROM kpi_comments WHERE engagement_id='${q(engagementId)}' ORDER BY created_at DESC`);
  const agileItems = await all(`SELECT * FROM agile_items WHERE engagement_id='${q(engagementId)}' ORDER BY type, rowid`);
  const portfolioHealth = Math.round(processZones.reduce((sum, zone) => sum + Number(zone.health_score || 0), 0) / Math.max(processZones.length, 1));
  return { engagement, systems, processZones, metrics, tasks, notifications, kpiComments, agileItems, portfolioHealth };
}

app.get("/api/health", async (_req, res) => {
  res.json({ ok: true, database: "portfolio.sqlite", time: new Date().toISOString() });
});

app.post("/api/auth/login", async (req, res) => {
  const email = req.body.email || "organizer@rrdigital.local";
  let user = await one(`SELECT * FROM users WHERE email='${q(email)}'`);
  if (!user) {
    user = {
      id: id("user"),
      name: req.body.name || email.split("@")[0],
      email,
      role: "Organizer",
      auth_provider: "local",
      created_at: new Date().toISOString(),
    };
    await run(`INSERT INTO users VALUES ('${q(user.id)}','${q(user.name)}','${q(user.email)}','${q(user.role)}','${q(user.auth_provider)}','${q(user.created_at)}')`);
  }
  res.json({ user });
});

app.get("/api/bootstrap", async (_req, res) => {
  const engagements = await all("SELECT * FROM engagements ORDER BY updated_at DESC");
  const zones = await all("SELECT * FROM process_zones ORDER BY rowid");
  res.json({ engagements, zones });
});

app.get("/api/engagements/:id", async (req, res) => {
  res.json(await engagementPayload(req.params.id));
});

app.get("/api/portfolio/:id", async (req, res) => {
  const engagementId = q(req.params.id);
  const sponsors = await all(`SELECT * FROM sponsors WHERE engagement_id='${engagementId}' ORDER BY risk_score DESC`);
  const studies = await all(`SELECT * FROM studies WHERE engagement_id='${engagementId}' ORDER BY status DESC, completion_date`);
  const fspRequirements = await all(`SELECT * FROM fsp_requirements WHERE engagement_id='${engagementId}' ORDER BY status, start_date`);
  res.json({ sponsors, studies, fspRequirements, source: "Local mock portfolio data" });
});

app.get("/api/portfolio/:id/zones/:zoneId/details", async (req, res) => {
  const engagementId = q(req.params.id);
  const zoneName = await one(`SELECT name FROM process_zones WHERE id='${q(req.params.zoneId)}'`);
  const name = q(zoneName?.name || "");
  const studies = await all(`SELECT * FROM studies WHERE engagement_id='${engagementId}' AND process_zone_signal='${name}' ORDER BY status, completion_date`);
  const fspRequirements = await all(`SELECT * FROM fsp_requirements WHERE engagement_id='${engagementId}' AND process_zone_signal='${name}' ORDER BY status, start_date`);
  const tasks = await all(`SELECT * FROM task_actions WHERE engagement_id='${engagementId}' AND process_zone_id='${q(req.params.zoneId)}' ORDER BY due_date`);
  const comments = await all(`SELECT * FROM kpi_comments WHERE engagement_id='${engagementId}' AND process_zone_id='${q(req.params.zoneId)}' ORDER BY created_at DESC`);
  res.json({ studies, fspRequirements, tasks, comments });
});

app.post("/api/engagements", async (req, res) => {
  const now = new Date().toISOString();
  const engagementId = id("eng");
  await run(`
    INSERT INTO engagements VALUES (
      '${q(engagementId)}',
      '${q(req.body.name || "New Hybrid Portfolio Engagement")}',
      '${q(req.body.description || "New portfolio created from local prototype.")}',
      'user-org-1',
      '${q(req.body.modelType || "Hybrid FSO/FSP")}',
      'Draft',
      '${q(req.body.sponsorLabel || "New sponsor portfolio")}',
      '${q(req.body.brandPrimary || "#2563eb")}',
      '${q(now)}',
      '${q(now)}'
    )
  `);
  await run(`
    INSERT INTO systems_landscape VALUES (
      '${q(id("sys"))}','${q(engagementId)}','${q(req.body.crmSystem || "")}','${q(req.body.pricingTools || "")}',
      '${q(req.body.contractRepository || "")}','${q(req.body.resourceManagementSystem || "")}',
      '${q(req.body.hrTalentSystem || "")}','${q(req.body.financeSystems || "")}',
      '${q(req.body.projectTools || "")}','${q(req.body.biTools || "")}',
      '${q(req.body.documentRepository || "")}','${q(req.body.collaborationTools || "")}',
      ${req.body.dataLakeAvailable ? 1 : 0},'${q(req.body.notes || "")}'
    )
  `);
  const zones = await all("SELECT * FROM process_zones");
  for (const zone of zones) {
    await run(`
      INSERT INTO engagement_process_zones VALUES (
        '${q(id("epz"))}','${q(engagementId)}','${q(zone.id)}',1,3,50,
        '${q(JSON.stringify(["Capture baseline", "Map system handoffs", "Define KPIs", "Prioritize requirements"]))}',
        '${q(JSON.stringify(["AI search placeholder", "Workflow copilot candidate"]))}'
      )
    `);
  }
  res.json(await engagementPayload(engagementId));
});

app.post("/api/comments", async (req, res) => {
  const now = new Date().toISOString();
  const commentId = id("comment");
  await run(`
    INSERT INTO comments VALUES (
      '${q(commentId)}','${q(req.body.engagementId)}','${q(req.body.processZoneId || "")}',
      '${q(req.body.componentRef || "General")}','${q(req.body.parentCommentId || "")}',
      '${q(req.body.author || "Contributor")}','${q(req.body.body)}','${q(req.body.priority || "Medium")}',
      'Open','${q(now)}'
    )
  `);
  res.json({ ok: true, commentId });
});

app.post("/api/kpi-comments", async (req, res) => {
  const now = new Date().toISOString();
  const commentId = id("kpic");
  await run(`
    INSERT INTO kpi_comments VALUES (
      '${q(commentId)}','${q(req.body.engagementId)}','${q(req.body.processZoneId || "")}',
      '${q(req.body.metricId)}','${q(req.body.metricName)}','${q(req.body.commentText)}',
      '${q(req.body.author || "Organizer")}','${q(req.body.assigneeEmail || "")}',
      '${q(req.body.assigneeEmail ? "Assigned" : "Saved")}','${q(now)}'
    )
  `);
  let email = null;
  if (req.body.assigneeEmail) {
    const emailId = id("email");
    const subject = `Portfolio KPI comment assigned: ${req.body.metricName}`;
    const body = `You have been assigned a KPI comment.\n\nMetric: ${req.body.metricName}\nComment: ${req.body.commentText}\nPortfolio: ${req.body.portfolioName || req.body.engagementId}\n\nThis local prototype stores the email in an outbox until SMTP is configured.`;
    await run(`
      INSERT INTO email_outbox VALUES (
        '${q(emailId)}','${q(req.body.engagementId)}','${q(req.body.assigneeEmail)}',
        '${q(subject)}','${q(body)}','Queued - SMTP not configured','${q(now)}'
      )
    `);
    email = { id: emailId, status: "Queued - SMTP not configured" };
  }
  res.json({ ok: true, commentId, email });
});

app.post("/api/requirements", async (req, res) => {
  const now = new Date().toISOString();
  const requirementId = id("req");
  await run(`
    INSERT INTO custom_requirements VALUES (
      '${q(requirementId)}','${q(req.body.engagementId)}','${q(req.body.processZoneId || "")}',
      '${q(req.body.title)}','${q(req.body.description)}','${q(req.body.businessReason || "")}',
      '${q(req.body.priority || "Medium")}','Open','${q(req.body.submittedBy || "Organizer")}','${q(now)}'
    )
  `);
  for (const file of req.body.attachments || []) {
    await run(`
      INSERT INTO attachments VALUES (
        '${q(id("att"))}','${q(req.body.engagementId)}','${q(requirementId)}',
        '${q(file.name)}','${q(file.type || "unknown")}',${Number(file.size || 0)},1,'${q(now)}'
      )
    `);
  }
  res.json({ ok: true, requirementId });
});

app.get("/api/report/:id", async (req, res) => {
  const comments = await all(`SELECT * FROM kpi_comments WHERE engagement_id='${q(req.params.id)}' ORDER BY created_at DESC`);
  const emails = await all(`SELECT * FROM email_outbox WHERE engagement_id='${q(req.params.id)}' ORDER BY created_at DESC`);
  res.json({ comments, emails });
});

app.post("/api/agile-plan/:id", async (req, res) => {
  const engagementId = req.params.id;
  await run(`DELETE FROM agile_items WHERE engagement_id='${q(engagementId)}'`);
  const db = await require("./db").getDb();
  seedAgile(db, engagementId);
  require("./db").save();
  const agileItems = await all(`SELECT * FROM agile_items WHERE engagement_id='${q(engagementId)}' ORDER BY type, rowid`);
  res.json({ agileItems });
});

app.post("/api/ai-search", async (req, res) => {
  const question = String(req.body.question || "").toLowerCase();
  let answer = "The mock AI agent can answer from seeded portfolio context. Try asking about portfolio health, FSO studies, FSP role needs, scope drift, resources, finance, or contract readiness.";
  if (question.includes("scope")) answer = "There are 7 scope-drift alerts. The highest-value next action is to review uncovered work in Oversight & Scope Changes and convert approved drift into change-control tasks.";
  if (question.includes("finance") || question.includes("revenue")) answer = "Finance is healthy but watch forecast accuracy. Revenue-routing accuracy is 99%, while forecast accuracy is 92% against a 95% target.";
  if (question.includes("resource") || question.includes("allocation")) answer = "Resource Management shows 90% demand conversion accuracy and 85% resource fit. The main open action is resolving shared-resource variance.";
  if (question.includes("contract")) answer = "Contract load readiness is 98%, but scope boundary decisions should stay under 3 days to avoid downstream leakage.";
  res.json({ answer, citations: ["Seeded KPIs", "Open tasks", "Process-zone dashboard"] });
});

app.get("/api/export/:id", async (req, res) => {
  const payload = await engagementPayload(req.params.id);
  const portfolio = await all(`SELECT * FROM studies WHERE engagement_id='${q(req.params.id)}'`);
  const fsp = await all(`SELECT * FROM fsp_requirements WHERE engagement_id='${q(req.params.id)}'`);
  const buffer = buildWorkbook([
    ["KPIs", payload.metrics],
    ["KPI Comments", payload.kpiComments],
    ["FSO Studies", portfolio],
    ["FSP Requirements", fsp],
    ["Agile Plan", payload.agileItems],
  ]);
  res.setHeader("Content-Disposition", "attachment; filename=portfolio-export.xlsx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buffer);
});

function buildWorkbook(sheets) {
  const files = {};
  files["[Content_Types].xml"] = xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}
</Types>`);
  files["_rels/.rels"] = xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  files["xl/workbook.xml"] = xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map(([name], i) => `<sheet name="${escapeXml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
</workbook>`);
  files["xl/_rels/workbook.xml.rels"] = xml(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}
</Relationships>`);
  sheets.forEach(([name, data], i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = xml(sheetXml(name, data));
  });
  return Buffer.from(zipSync(files));
}

function xml(value) {
  return strToU8(value);
}

function sheetXml(_name, data) {
  const rows = data.length ? data : [{ note: "No records" }];
  const headers = Object.keys(rows[0]);
  const allRows = [headers, ...rows.map((row) => headers.map((header) => row[header] ?? ""))];
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${allRows.map((row, rowIndex) => `<row r="${rowIndex + 1}">
      ${row.map((cell, colIndex) => `<c r="${columnName(colIndex + 1)}${rowIndex + 1}" t="inlineStr"><is><t>${escapeXml(cell)}</t></is></c>`).join("")}
    </row>`).join("")}
  </sheetData>
</worksheet>`;
}

function columnName(number) {
  let name = "";
  while (number > 0) {
    const mod = (number - 1) % 26;
    name = String.fromCharCode(65 + mod) + name;
    number = Math.floor((number - mod) / 26);
  }
  return name;
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
app.use((req, res, next) => {
  if (req.method !== "GET" || req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`Clinical Portfolio Management Solutions listening on port ${port}`);
});
