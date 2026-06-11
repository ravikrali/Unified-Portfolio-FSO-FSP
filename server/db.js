const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "portfolio.sqlite");
let SQL;
let db;

function q(value) {
  return String(value ?? "").replaceAll("'", "''");
}

function rows(result) {
  if (!result.length) return [];
  const { columns, values } = result[0];
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

async function getDb() {
  if (db) return db;
  SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, "..", "node_modules", "sql.js", "dist", file),
  });
  fs.mkdirSync(dataDir, { recursive: true });
  if (fs.existsSync(dbPath)) {
    db = new SQL.Database(fs.readFileSync(dbPath));
    ensurePortfolioSchema(db);
    db.run("UPDATE engagements SET name='Hybrid Portfolio Transformation Mock Portfolio', description='Pre-built portfolio demonstrating hybrid FSO/FSP operations for a small-to-mid-sized CRO.' WHERE id='eng-mock'");
    seedPortfolioIfNeeded(db);
    save();
  } else {
    db = new SQL.Database();
    createSchema(db);
    ensurePortfolioSchema(db);
    seed(db);
    seedPortfolioIfNeeded(db);
    save();
  }
  return db;
}

function save() {
  if (!db) return;
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function createSchema(database) {
  database.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      auth_provider TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE engagements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      owner_user_id TEXT NOT NULL,
      model_type TEXT NOT NULL,
      status TEXT NOT NULL,
      sponsor_label TEXT,
      brand_primary TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE systems_landscape (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      crm_system TEXT,
      pricing_tools TEXT,
      contract_repository TEXT,
      resource_management_system TEXT,
      hr_talent_system TEXT,
      finance_systems TEXT,
      project_tools TEXT,
      bi_tools TEXT,
      document_repository TEXT,
      collaboration_tools TEXT,
      data_lake_available INTEGER,
      notes TEXT
    );

    CREATE TABLE process_zones (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      accent TEXT NOT NULL,
      value_statement TEXT NOT NULL
    );

    CREATE TABLE engagement_process_zones (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT NOT NULL,
      current_maturity INTEGER NOT NULL,
      target_maturity INTEGER NOT NULL,
      health_score INTEGER NOT NULL,
      operating_pattern TEXT NOT NULL,
      ai_enablers TEXT NOT NULL
    );

    CREATE TABLE kpi_metrics (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      unit TEXT,
      target TEXT,
      status TEXT NOT NULL,
      trend TEXT NOT NULL,
      description TEXT NOT NULL,
      last_updated TEXT NOT NULL
    );

    CREATE TABLE task_actions (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      owner TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      due_date TEXT NOT NULL
    );

    CREATE TABLE notifications (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      created_at TEXT NOT NULL,
      read_at TEXT
    );

    CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT,
      component_ref TEXT NOT NULL,
      parent_comment_id TEXT,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE custom_requirements (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      business_reason TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      submitted_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE attachments (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      requirement_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      metadata_only INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE agile_items (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id TEXT,
      process_zone_id TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL,
      acceptance_criteria TEXT,
      source_refs TEXT,
      status TEXT NOT NULL
    );
  `);
}

function ensurePortfolioSchema(database) {
  database.run(`
    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      study_count INTEGER NOT NULL,
      active_study_count INTEGER NOT NULL,
      risk_score INTEGER NOT NULL,
      portfolio_value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS studies (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      sponsor_id TEXT NOT NULL,
      nct_id TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      phase TEXT,
      condition TEXT,
      start_date TEXT,
      completion_date TEXT,
      enrollment INTEGER,
      process_zone_signal TEXT NOT NULL,
      ai_recommendation TEXT NOT NULL,
      source_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fsp_requirements (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      sponsor_id TEXT NOT NULL,
      title TEXT NOT NULL,
      role_type TEXT NOT NULL,
      status TEXT NOT NULL,
      geography TEXT NOT NULL,
      fte_need REAL NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      process_zone_signal TEXT NOT NULL,
      ai_recommendation TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS kpi_comments (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      process_zone_id TEXT,
      metric_id TEXT NOT NULL,
      metric_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      author TEXT NOT NULL,
      assignee_email TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_outbox (
      id TEXT PRIMARY KEY,
      engagement_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function insert(table, obj, database = db) {
  const cols = Object.keys(obj);
  database.run(`INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map((c) => `'${q(obj[c])}'`).join(",")})`);
}

function seed(database) {
  const now = new Date().toISOString();
  insert("users", {
    id: "user-org-1",
    name: "Organizer User",
    email: "organizer@rrdigital.local",
    role: "Organizer",
    auth_provider: "local",
    created_at: now,
  }, database);

  insert("engagements", {
    id: "eng-mock",
    name: "Hybrid Portfolio Transformation Mock Portfolio",
    description: "Pre-built portfolio demonstrating hybrid FSO/FSP operations for a small-to-mid-sized CRO.",
    owner_user_id: "user-org-1",
    model_type: "Hybrid FSO/FSP",
    status: "Active mock",
    sponsor_label: "Public sponsor/study portfolio",
    brand_primary: "#2563eb",
    created_at: now,
    updated_at: now,
  }, database);

  insert("systems_landscape", {
    id: "sys-mock",
    engagement_id: "eng-mock",
    crm_system: "Salesforce",
    pricing_tools: "NEO, Excel pricing workbooks",
    contract_repository: "SharePoint contract workspace",
    resource_management_system: "RMS, SMT",
    hr_talent_system: "Workday",
    finance_systems: "OPF, Oracle, Hyperion",
    project_tools: "Smartsheet, PM workspace",
    bi_tools: "Power BI",
    document_repository: "SharePoint",
    collaboration_tools: "Teams, Outlook",
    data_lake_available: 1,
    notes: "Seeded mock landscape aligned to hybrid process-zone needs.",
  }, database);

  const zones = [
    ["scoping-pricing", "Scoping & Pricing", "Hybrid intake, solutioning, assumptions, pricing scenarios, and SME routing.", "#d89c2b", "Faster, more consistent hybrid solution design with fewer pricing defects and clearer commercial decision rights."],
    ["contracts", "Contracts & Amendments", "Contract structure, scope boundaries, obligations, change control, and amendment readiness.", "#4e9cc4", "Clean contract structures, visible obligations, and earlier change capture before ambiguity becomes leakage."],
    ["resource-management", "Resource Management", "Demand translation, matching, shared assignments, allocation, utilization, and variance control.", "#63a66e", "Dynamic capacity orchestration across delivery models while reducing manual assignment work and utilization risk."],
    ["talent-acquisition", "Talent Acquisition", "Req quality, internal talent, candidate matching, borrowable talent, and hybrid req routing.", "#d75f4b", "Faster fulfillment through internal-first matching, cleaner requisitions, and clear routing for partial or hybrid needs."],
    ["people-management", "People Management", "Transitions, goals, approvals, onboarding, readiness, and shared-resource experience.", "#865b84", "Protected employee experience when people move across models, split goals, or operate under shared accountability."],
    ["finance", "Finance", "Forecasting, revenue routing, billing, profitability, leakage, and financial aggregation.", "#426aa7", "One financial truth across contracts, work orders, service lines, margin logic, revenue routing, and billing risk."],
    ["oversight-scope", "Oversight & Scope Changes", "Governance, model drift, scope drift, QBR/OBR, health, risks, actions, and playbooks.", "#b94a3b", "Integrated account control by detecting model drift, scope drift, KPI misses, and unresolved decisions early."],
  ];
  zones.forEach((z, i) => {
    insert("process_zones", { id: z[0], name: z[1], description: z[2], accent: z[3], value_statement: z[4] }, database);
    insert("engagement_process_zones", {
      id: `epz-${z[0]}`,
      engagement_id: "eng-mock",
      process_zone_id: z[0],
      current_maturity: i % 2 === 0 ? 2 : 3,
      target_maturity: i < 3 ? 5 : 4,
      health_score: [78, 72, 81, 69, 74, 76, 71][i],
      operating_pattern: JSON.stringify([
        "Capture standardized inputs",
        "Route decision rights",
        "Track control signals",
        "Escalate exceptions",
      ]),
      ai_enablers: JSON.stringify([
        "Classification assistant",
        "Completeness checker",
        "Workflow copilot",
        "Executive summary generator",
      ]),
    }, database);
  });

  const metrics = [
    ["Portfolio health", "82", "%", ">=85", "watch", "+4%", "Composite portfolio signal across scope, finance, quality, utilization, and actions", null],
    ["Open risk actions", "18", "", "<12", "watch", "-3", "Outstanding risks and actions requiring owner follow-up", null],
    ["Scope-drift alerts", "7", "", "<5", "risk", "+2", "Potential uncovered work detected across hybrid programs", "oversight-scope"],
    ["Forecast accuracy", "92", "%", ">=95", "watch", "+6%", "Actual vs forecast across hours, units, EAC, and billing assumptions", "finance"],
    ["Scenario cycle time", "<5", "days", "<5", "good", "-2d", "Qualified intake to priced hybrid options", "scoping-pricing"],
    ["Assumption completeness", "95", "%", ">=95", "good", "+8%", "Required fields and scope drivers captured", "scoping-pricing"],
    ["Contract load readiness", "98", "%", ">=97", "good", "+5%", "Artifacts complete for finance and operations load", "contracts"],
    ["Boundary decision time", "<3", "days", "<3", "good", "-1d", "Time to decide in-scope, model route, and pricing impact", "contracts"],
    ["Demand conversion accuracy", "90", "%", ">=90", "good", "+7%", "Scope translated to role, month, geography, and FTE", "resource-management"],
    ["Resource fit score", "85", "%", ">=88", "watch", "+4%", "Skills, location, availability, and client readiness match", "resource-management"],
    ["Req quality pass rate", "80", "%", ">=90", "watch", "+6%", "Requisitions ready to post on first submission", "talent-acquisition"],
    ["Internal fill share", "25", "%", ">=30", "watch", "+3%", "Internal or borrowable talent identified before external search", "talent-acquisition"],
    ["Goal alignment coverage", "100", "%", "100", "good", "+10%", "Split resources with clear goals and reviewer path", "people-management"],
    ["Burnout risk exceptions", "<8", "%", "<5", "watch", "-2%", "Over-utilization and context switching alerts", "people-management"],
    ["Revenue routing accuracy", "99", "%", ">=99", "good", "+1%", "Performance obligation and billing path alignment", "finance"],
    ["QBR action closure", "90", "%", ">=90", "good", "+9%", "Actions completed by due date", "oversight-scope"],
  ];
  metrics.forEach((m, i) => insert("kpi_metrics", {
    id: `kpi-${i + 1}`,
    engagement_id: "eng-mock",
    process_zone_id: m[7],
    name: m[0],
    value: m[1],
    unit: m[2],
    target: m[3],
    status: m[4],
    trend: m[5],
    description: m[6],
    last_updated: now,
  }, database));

  const tasks = [
    ["task-1", "Confirm hybrid routing criteria", "Finalize trigger rules for opportunity tagging and quarterback review.", "Solution Lead", "High", "In progress", "2026-06-17", "scoping-pricing"],
    ["task-2", "Review contract structure rules", "Validate one-vs-many work order decision paths with finance and operations.", "Contract Lead", "High", "Open", "2026-06-20", "contracts"],
    ["task-3", "Resolve shared-resource variance", "Review allocation mismatch on two partially assigned roles.", "Resource Lead", "Medium", "Open", "2026-06-14", "resource-management"],
    ["task-4", "Generate QBR readiness pack", "Prepare unified health narrative and open action list.", "Program Lead", "Medium", "In progress", "2026-06-21", "oversight-scope"],
  ];
  tasks.forEach((t) => insert("task_actions", {
    id: t[0], engagement_id: "eng-mock", title: t[1], description: t[2], owner: t[3], priority: t[4], status: t[5], due_date: t[6], process_zone_id: t[7],
  }, database));

  const notes = [
    ["note-1", "Scope drift watch", "Seven candidate scope-drift alerts require owner decision before month close.", "High", "oversight-scope"],
    ["note-2", "Forecast improved", "Forecast accuracy improved by six points after demand translation cleanup.", "Medium", "finance"],
    ["note-3", "Req quality needs attention", "Talent acquisition quality gate is below target on hybrid reqs.", "Medium", "talent-acquisition"],
  ];
  notes.forEach((n) => insert("notifications", {
    id: n[0], engagement_id: "eng-mock", title: n[1], message: n[2], severity: n[3], process_zone_id: n[4], created_at: now, read_at: "",
  }, database));

  const comments = [
    ["comment-1", "KPI dashboard", "Can we add a drill-down from portfolio health into scope-drift root causes?", "High", "Open", "oversight-scope"],
    ["comment-2", "Resource cockpit", "The partial allocation view should show manager approval status.", "Medium", "Open", "resource-management"],
    ["comment-3", "AI search", "Search should cite source records when answering finance or contract questions.", "High", "Open", "finance"],
  ];
  comments.forEach((c) => insert("comments", {
    id: c[0], engagement_id: "eng-mock", component_ref: c[1], author: "Contributor", body: c[2], priority: c[3], status: c[4], process_zone_id: c[5], parent_comment_id: "", created_at: now,
  }, database));

  const reqs = [
    ["req-1", "Scope change heatmap", "Create a heatmap that ranks scope drift by sponsor, study, process zone, and financial impact.", "Prioritize change orders before leakage grows.", "High", "oversight-scope"],
    ["req-2", "Hybrid talent marketplace", "Show borrowable internal talent for less-than-0.5 FTE needs and short-term assignments.", "Reduce external hiring and speed fulfillment.", "Medium", "talent-acquisition"],
  ];
  reqs.forEach((r) => insert("custom_requirements", {
    id: r[0], engagement_id: "eng-mock", title: r[1], description: r[2], business_reason: r[3], priority: r[4], status: "Open", process_zone_id: r[5], submitted_by: "Organizer", created_at: now,
  }, database));

  seedAgile(database);
}

function seedPortfolioIfNeeded(database) {
  const marker = rows(database.exec("SELECT COUNT(*) AS count FROM sponsors WHERE source='Mock portfolio data'"))[0]?.count || 0;
  if (marker > 0) return;
  database.run("DELETE FROM sponsors");
  database.run("DELETE FROM studies");
  database.run("DELETE FROM fsp_requirements");
  const sponsors = [
    ["sponsor-a", "Sponsor Alpha", "Mock portfolio data", 4, 3, 31, "$4.8M"],
    ["sponsor-b", "Sponsor Beta", "Mock portfolio data", 3, 2, 42, "$3.6M"],
    ["sponsor-c", "Sponsor Gamma", "Mock portfolio data", 3, 2, 24, "$3.1M"],
    ["sponsor-d", "Sponsor Delta", "Mock portfolio data", 2, 1, 36, "$2.9M"],
  ];
  sponsors.forEach((s) => insert("sponsors", {
    id: s[0],
    engagement_id: "eng-mock",
    name: s[1],
    source: s[2],
    study_count: s[3],
    active_study_count: s[4],
    risk_score: s[5],
    portfolio_value: s[6],
  }, database));

  const studies = [
    ["study-1", "sponsor-a", "MOCK-FSO-001", "Global oncology phase II study", "RECRUITING", "PHASE2", "Oncology", "2024-01", "2027-08", 180, "Oversight & Scope Changes", "Monitor scope-drift risk due to active enrollment and complex treatment arms."],
    ["study-2", "sponsor-a", "MOCK-FSO-002", "Immunology adaptive design study", "ACTIVE", "PHASE2", "Immunology", "2023-04", "2026-11", 96, "Resource Management", "Review shared resource allocation for monitoring and biometrics support."],
    ["study-3", "sponsor-b", "MOCK-FSO-003", "Cardiometabolic outcomes study", "RECRUITING", "PHASE3", "Cardiometabolic", "2024-02", "2027-05", 420, "Talent Acquisition", "Prioritize internal candidate matching for high-volume site support roles."],
    ["study-4", "sponsor-b", "MOCK-FSO-004", "Respiratory safety extension study", "COMPLETED", "PHASE3", "Respiratory", "2022-03", "2025-02", 360, "Contracts & Amendments", "Check amendment closeout and obligation dashboard completion."],
    ["study-5", "sponsor-c", "MOCK-FSO-005", "Rare disease registry study", "RECRUITING", "PHASE4", "Rare Disease", "2024-05", "2028-01", 510, "Scoping & Pricing", "Run pricing scenario sensitivity for expanded geography and enrollment assumptions."],
    ["study-6", "sponsor-c", "MOCK-FSO-006", "Neurology biomarker study", "ACTIVE", "PHASE2", "Neurology", "2024-07", "2028-04", 640, "Resource Management", "Forecast CRA and medical writing demand using active enrollment milestones."],
    ["study-7", "sponsor-d", "MOCK-FSO-007", "Pediatric infectious disease study", "ACTIVE", "PHASE2", "Infectious Disease", "2023-09", "2027-03", 210, "People Management", "Review transition and burnout signals for split model team members."],
    ["study-8", "sponsor-d", "MOCK-FSO-008", "Oncology closeout study", "COMPLETED", "PHASE1", "Oncology", "2021-10", "2025-06", 88, "Finance", "Complete final forecast-to-actual and billing exception review."],
  ];
  studies.forEach((s) => insert("studies", {
    id: s[0],
    engagement_id: "eng-mock",
    sponsor_id: s[1],
    nct_id: s[2],
    title: s[3],
    status: s[4],
    phase: s[5],
    condition: s[6],
    start_date: s[7],
    completion_date: s[8],
    enrollment: s[9],
    process_zone_signal: s[10],
    ai_recommendation: s[11],
    source_url: "",
  }, database));

  const fsp = [
    ["fsp-1", "sponsor-a", "CRA surge support for oncology portfolio", "CRA", "Open", "US", 2.5, "2026-07", "2027-01", "Resource Management", "Match available CRAs with oncology experience and partial allocation readiness."],
    ["fsp-2", "sponsor-a", "Medical writing protocol amendment package", "Medical Writer", "In progress", "Global", 0.8, "2026-06", "2026-09", "Contracts & Amendments", "Check whether amendment workload is in scope or requires change control."],
    ["fsp-3", "sponsor-b", "Biostatistics ad hoc analysis pool", "Biostatistician", "Open", "EU", 1.2, "2026-08", "2027-02", "Scoping & Pricing", "Run unitized versus FTE pricing scenario for variable monthly demand."],
    ["fsp-4", "sponsor-b", "Safety case processing capacity", "Safety Specialist", "At risk", "India", 3.0, "2026-07", "2027-07", "Talent Acquisition", "Trigger internal-first candidate matching before external req creation."],
    ["fsp-5", "sponsor-c", "Data management query clean-up", "Data Manager", "Open", "US/EU", 1.5, "2026-06", "2026-12", "Finance", "Monitor billing and utilization to avoid under-recovery on variable work."],
    ["fsp-6", "sponsor-d", "Project coordinator fractional support", "Project Coordinator", "Open", "US", 0.4, "2026-07", "2026-10", "People Management", "Use shared-resource goal routing and manager approval controls."],
  ];
  fsp.forEach((r) => insert("fsp_requirements", {
    id: r[0],
    engagement_id: "eng-mock",
    sponsor_id: r[1],
    title: r[2],
    role_type: r[3],
    status: r[4],
    geography: r[5],
    fte_need: r[6],
    start_date: r[7],
    end_date: r[8],
    process_zone_signal: r[9],
    ai_recommendation: r[10],
  }, database));
}

function seedAgile(database, engagementId = "eng-mock") {
  insert("agile_items", {
    id: `epic-1-${engagementId}`, engagement_id: engagementId, type: "Epic", parent_id: "", process_zone_id: "oversight-scope", title: "Unified hybrid account health", description: "Create a cross-model view of account health, actions, risks, scope drift, and financial control.", priority: "High", acceptance_criteria: "", source_refs: "comment-1,req-1", status: "Draft",
  }, database);
  insert("agile_items", {
    id: `feature-1-${engagementId}`, engagement_id: engagementId, type: "Feature", parent_id: `epic-1-${engagementId}`, process_zone_id: "oversight-scope", title: "Scope drift heatmap", description: "Rank candidate scope changes by sponsor, study, process zone, aging, and expected financial impact.", priority: "High", acceptance_criteria: "", source_refs: "req-1", status: "Draft",
  }, database);
  insert("agile_items", {
    id: `story-1-${engagementId}`, engagement_id: engagementId, type: "Story", parent_id: `feature-1-${engagementId}`, process_zone_id: "oversight-scope", title: "As a program lead, I need scope-drift heatmap filters so I can focus governance on the highest-risk changes.", description: "Add filterable heatmap over seeded scope-change signals.", priority: "High", acceptance_criteria: "Heatmap supports sponsor, study, process zone, severity, and owner filters; each cell links to source alert; export includes selected filters.", source_refs: "req-1", status: "Draft",
  }, database);
}

async function all(sql) {
  const database = await getDb();
  return rows(database.exec(sql));
}

async function one(sql) {
  return (await all(sql))[0] ?? null;
}

async function run(sql) {
  const database = await getDb();
  database.run(sql);
  save();
}

module.exports = { getDb, all, one, run, insert, save, q, seedAgile };
