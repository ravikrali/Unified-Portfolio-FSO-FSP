import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  ChevronRight,
  ClipboardList,
  Database,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./styles.css";

const api = {
  async get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`GET ${path} failed`);
    return res.json();
  },
  async post(path, body) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed`);
    return res.json();
  },
};

const emptyPortfolio = { sponsors: [], studies: [], fspRequirements: [], source: "" };

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [view, setView] = useState("landing");
  const [viewHistory, setViewHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [bootstrap, setBootstrap] = useState({ engagements: [], zones: [] });
  const [payload, setPayload] = useState(null);
  const [activeZoneId, setActiveZoneId] = useState("scoping-pricing");
  const [activeServiceLine, setActiveServiceLine] = useState("fso");
  const [loading, setLoading] = useState(false);
  const [metricDialog, setMetricDialog] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    api.get("/api/bootstrap").then(setBootstrap).catch(console.error);
  }, []);

  function goTo(nextView) {
    setView((current) => {
      if (current !== nextView) {
        setViewHistory((history) => [...history, current].slice(-12));
        window.history.pushState({ appBack: true }, "");
      }
      return nextView;
    });
  }

  function goBack() {
    setViewHistory((history) => {
      const previous = history.at(-1);
      if (previous) {
        setView(previous);
        return history.slice(0, -1);
      }
      if (view !== "home" && user) setView("home");
      else setView("landing");
      return [];
    });
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.state?.appBack) goBack();
    };
    window.history.replaceState({ appBack: true }, "");
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [view, user]);

  async function loadEngagement(id = "eng-mock", nextView = "dashboard") {
    setLoading(true);
    try {
      const next = await api.get(`/api/engagements/${id}`);
      setPayload(next);
      setActiveZoneId(next.processZones?.[0]?.id || "scoping-pricing");
      setActiveServiceLine("fso");
      goTo(nextView);
    } finally {
      setLoading(false);
    }
  }

  async function login(email = "organizer@rrdigital.local") {
    const result = await api.post("/api/auth/login", { email, name: "Organizer User" });
    setUser(result.user);
    goTo("home");
  }

  async function refresh() {
    if (payload?.engagement?.id) {
      const next = await api.get(`/api/engagements/${payload.engagement.id}`);
      setPayload(next);
    }
  }

  const nav = { setView: goTo, goBack, loadEngagement, setActiveZoneId, setActiveServiceLine, refresh, openMetricDialog: setMetricDialog };
  const portfolioViews = ["dashboard", "zone", "portfolio", "agile", "serviceLine"];
  const showAiSearch = payload && portfolioViews.includes(view);

  return (
    <div className="app-shell">
      <TopBar
        theme={theme}
        toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        user={user}
        view={view}
        setView={goTo}
        canGoBack={viewHistory.length > 0 || (user && view !== "home")}
        goBack={goBack}
      />
      {showAiSearch && <GlobalAiSearch />}
      {loading && <div className="loading-line" />}
      {view === "landing" && <Landing onLogin={login} onMock={() => loadEngagement("eng-mock")} />}
      {view === "signin" && <SignIn onLogin={login} />}
      {view === "home" && (
        <Home
          user={user}
          portfolios={bootstrap.engagements}
          onMock={() => loadEngagement("eng-mock")}
          onCreate={() => goTo("create")}
        />
      )}
      {view === "create" && <CreateEngagement zones={bootstrap.zones} onCreated={(next) => { setPayload(next); goTo("dashboard"); }} />}
      {view === "dashboard" && payload && <Dashboard payload={payload} nav={nav} />}
      {view === "zone" && payload && <ZoneDashboard payload={payload} zoneId={activeZoneId} nav={nav} />}
      {view === "serviceLine" && payload && <ServiceLineDetail payload={payload} serviceLine={activeServiceLine} nav={nav} />}
      {view === "portfolio" && payload && <PortfolioData payload={payload} nav={nav} />}
      {view === "agile" && payload && <AgilePlan payload={payload} nav={nav} />}
      {metricDialog && (
        <MetricCommentDialog
          metric={metricDialog.metric}
          processZoneId={metricDialog.processZoneId}
          portfolio={payload?.engagement}
          onClose={() => setMetricDialog(null)}
          onSaved={() => {
            setMetricDialog(null);
            refresh();
          }}
        />
      )}
      <footer className="app-footer">
        <span>Clinical Portfolio Management Solutions</span>
        <span>Local prototype with file-backed database</span>
      </footer>
    </div>
  );
}

function TopBar({ theme, toggleTheme, user, view, setView, canGoBack, goBack }) {
  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => setView("landing")} aria-label="Go to landing">
        <span className="brand-mark">CP</span>
        <span>
          <strong>Clinical Portfolio Management Solutions</strong>
          <small>Portfolio Command Center</small>
        </span>
      </button>
      {user && (
        <button className="button secondary nav-back" onClick={goBack} disabled={!canGoBack}>
          <ChevronRight size={16} className="back-chevron" /> Back
        </button>
      )}
      <nav className="nav-links">
        {user && <button onClick={() => setView("home")} className={view === "home" ? "active" : ""}>Home</button>}
        {user && <button onClick={() => setView("dashboard")} className={view === "dashboard" ? "active" : ""}>Portfolio Health</button>}
        {user && <button onClick={() => setView("portfolio")} className={view === "portfolio" ? "active" : ""}>Portfolio</button>}
      </nav>
      <div className="top-actions">
        <button className="icon-button" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        {user ? <span className="user-pill">{user.role}</span> : <button className="button ghost" onClick={() => setView("signin")}>Sign in</button>}
      </div>
    </header>
  );
}

function PortfolioData({ payload, nav }) {
  const [portfolio, setPortfolio] = useState({ sponsors: [], studies: [], fspRequirements: [], source: "" });

  async function load() {
    setPortfolio(await api.get(`/api/portfolio/${payload.engagement.id}`));
  }

  useEffect(() => {
    load().catch(console.error);
  }, [payload.engagement.id]);

  const statusCounts = portfolio.studies.reduce((acc, study) => {
    acc[study.status] = (acc[study.status] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  const fspFte = portfolio.fspRequirements.reduce((sum, item) => sum + Number(item.fte_need || 0), 0).toFixed(1);

  return (
    <main className="workspace">
      <PageTitle eyebrow="Portfolio" title={payload.engagement.name} subtitle="A portfolio contains FSO clinical studies and FSP smaller projects or role requirements. Process-zone KPI dashboards show health across the full portfolio." />
      <div className="metric-strip">
        <MetricMini label="Portfolio health" value={`${payload.portfolioHealth}%`} tone={payload.portfolioHealth >= 80 ? "good" : "watch"} />
        <MetricMini label="FSO studies" value={String(portfolio.studies.length)} tone="good" />
        <MetricMini label="FSP role needs" value={String(portfolio.fspRequirements.length)} tone="watch" />
        <MetricMini label="FSP FTE demand" value={fspFte} tone="watch" />
      </div>
      <div className="dashboard-grid">
        <section className="panel span-2">
          <div className="panel-title"><BarChart3 size={18} /> FSO study status mix</div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ff5a36" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <div className="panel-title"><Users size={18} /> Mock sponsors</div>
          <Stack
            items={portfolio.sponsors}
            render={(sponsor) => (
              <article className="list-item">
                <strong>{sponsor.name}</strong>
                <span>{sponsor.study_count} studies | {sponsor.active_study_count} active</span>
                <small>Risk score {sponsor.risk_score} | Value {sponsor.portfolio_value}</small>
              </article>
            )}
          />
        </section>
      </div>
      <section className="panel">
        <div className="panel-title"><Activity size={18} /> Process-zone health drill-down</div>
        <div className="zone-grid">
          {payload.processZones.map((zone) => (
            <button className="zone-tile" key={zone.id} onClick={() => { nav.setActiveZoneId(zone.id); nav.setView("zone"); }}>
              <span className="zone-accent" style={{ background: zone.accent }} />
              <strong>{zone.name}</strong>
              <span>{zone.value_statement}</span>
              <em>Health {zone.health_score}% | L{zone.current_maturity} to L{zone.target_maturity}</em>
            </button>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-title"><ClipboardList size={18} /> FSO study signals</div>
        <div className="study-table">
          <div className="study-row header">
            <span>Study ID</span>
            <span>Study</span>
            <span>Status</span>
            <span>Signal</span>
            <span>AI recommendation</span>
          </div>
          {portfolio.studies.map((study) => (
            <div className="study-row" key={study.id}>
              <span>{study.nct_id}</span>
              <span>{study.title}<small>{study.phase} | {study.condition} | Enrollment {study.enrollment || "TBD"}</small></span>
              <span>{study.status}</span>
              <span>{study.process_zone_signal}</span>
              <span>{study.ai_recommendation}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-title"><Users size={18} /> FSP project and role requirements</div>
        <div className="study-table">
          <div className="study-row header">
            <span>Requirement</span>
            <span>Role / project</span>
            <span>Status</span>
            <span>Signal</span>
            <span>AI recommendation</span>
          </div>
          {portfolio.fspRequirements.map((item) => (
            <div className="study-row" key={item.id}>
              <span>{item.id}</span>
              <span>{item.title}<small>{item.role_type} | {item.geography} | {item.fte_need} FTE | {item.start_date} to {item.end_date}</small></span>
              <span>{item.status}</span>
              <span>{item.process_zone_signal}</span>
              <span>{item.ai_recommendation}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Landing({ onLogin, onMock }) {
  const benefits = [
    ["Hybrid operating model", "Unify full-service accountability and functional-service flexibility with standard handoffs."],
    ["Process-zone dashboards", "Make scoping, contracts, resource, talent, people, finance, and oversight measurable."],
    ["Agentic transformation", "Turn KPI comments, assignments, and portfolio signals into prioritized action plans."],
    ["Database-first prototype", "Start locally with seeded portfolio data, then evolve toward real integrations."],
  ];
  return (
    <main className="landing">
      <section className="hero ai-saas-hero">
        <div className="hero-copy">
          <p className="announcement"><Sparkles size={14} /> AI-powered portfolio intelligence for hybrid clinical operations</p>
          <p className="eyebrow">Hybrid FSO/FSP portfolio management for CRO transformation</p>
          <h1>Turn clinical portfolio complexity into confident operating decisions.</h1>
          <p className="hero-subtitle">
            Clinical Portfolio Management Solutions helps CRO teams convert hybrid strategy into process-zone dashboards,
            KPI controls, collaboration, and AI-ready agile implementation plans.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => onLogin()}>Get started</button>
            <button className="button secondary" onClick={onMock}>View Mock Portfolio</button>
          </div>
        </div>
        <AIPortfolioAnimation />
      </section>
      <OpsImpactSection />
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Approach</p>
          <h2>Built for the operating work behind transformation</h2>
        </div>
        <div className="feature-grid">
          {benefits.map(([title, body]) => (
            <article className="feature" key={title}>
              <ShieldCheck size={18} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function AIPortfolioAnimation() {
  const flow = [
    ["FSO", "Study oversight", "Scope drift"],
    ["AI", "Portfolio agent", "Decision signal"],
    ["FSP", "Functional capacity", "Resource fit"],
  ];
  return (
    <div className="hero-panel ai-orbit-panel" aria-label="Animated AI portfolio management visualization">
      <div className="dashboard-window">
        <div className="window-dots"><span /><span /><span /></div>
        <div className="search-preview hero-search">
          <Search size={18} />
          <span>Ask: Which hybrid programs need action before month close?</span>
        </div>
        <div className="ai-flow">
          {flow.map(([label, title, sub], index) => (
            <div className={`flow-node node-${index + 1}`} key={label}>
              <strong>{label}</strong>
              <span>{title}</span>
              <small>{sub}</small>
            </div>
          ))}
          <div className="pulse-line line-a" />
          <div className="pulse-line line-b" />
        </div>
        <div className="signal-grid dashboard-preview-grid">
          <MetricMini label="Portfolio health" value="82%" tone="good" />
          <MetricMini label="Scope drift" value="-31%" tone="good" />
          <MetricMini label="Forecast lift" value="+18%" tone="watch" />
          <MetricMini label="QBR actions" value="90%" tone="good" />
        </div>
        <div className="agent-box animated-agent">
          <Bot size={18} />
          <span>Agent recommendation: convert 3 scope alerts into change-control actions</span>
        </div>
      </div>
    </div>
  );
}

function OpsImpactSection() {
  const impacts = [
    ["FSO operations", "Earlier scope-change detection", "31%", "lower leakage risk"],
    ["FSP operations", "Capacity and skills matching", "22%", "faster assignment fit"],
    ["Finance", "Forecast and billing signal quality", "18%", "forecast accuracy lift"],
    ["Governance", "AI-generated action packs", "40%", "less prep effort"],
  ];
  return (
    <section className="ops-impact-section">
      <div className="section-heading impact-heading">
        <div>
          <p className="eyebrow">AI-powered operating improvement</p>
          <h2>Portfolio agents connect FSO accountability and FSP flexibility.</h2>
        </div>
        <p>
          Animated control signals show how AI can convert fragmented operational data into earlier decisions,
          cleaner handoffs, and measurable portfolio outcomes.
        </p>
      </div>
      <div className="impact-visual-grid">
        {impacts.map(([zone, title, value, label], index) => (
          <article className="impact-card" key={zone}>
            <div className="impact-card-top">
              <span>{zone}</span>
              <Activity size={17} />
            </div>
            <h3>{title}</h3>
            <div className="impact-meter">
              <span style={{ animationDelay: `${index * 0.18}s` }} />
            </div>
            <strong>{value}</strong>
            <p>{label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function SignIn({ onLogin }) {
  const [email, setEmail] = useState("organizer@rrdigital.local");
  return (
    <main className="auth-layout">
      <section className="auth-panel">
        <p className="eyebrow">Local prototype auth</p>
        <h1>Sign in to CPMS Portfolio</h1>
        <p>Email/password and Google sign-in will use a free or low-cost provider later. This local cut creates a development user in the database.</p>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Password
          <input value="local-demo-password" type="password" readOnly />
        </label>
        <button className="button primary wide" onClick={() => onLogin(email)}>Continue locally</button>
      </section>
    </main>
  );
}

function Home({ user, portfolios, onMock, onCreate }) {
  return (
    <main className="workspace">
      <PageTitle eyebrow="Workspace" title={`Welcome${user?.name ? `, ${user.name}` : ""}`} subtitle="Start with the mock portfolio or create a new database-backed portfolio." />
      <div className="choice-grid">
        <button className="choice" onClick={onMock}>
          <LayoutDashboard size={26} />
          <strong>View mock portfolio</strong>
          <span>Preloaded CRO portfolio with FSO studies, FSP role needs, KPI dashboards, process zones, and AI search.</span>
        </button>
        <button className="choice" onClick={onCreate}>
          <Plus size={26} />
          <strong>Create new portfolio</strong>
          <span>Capture a systems landscape questionnaire and save a new portfolio in the local database.</span>
        </button>
      </div>
      <section className="panel">
        <div className="panel-title"><Database size={18} /> Local database portfolios</div>
        <div className="table">
          {portfolios.map((eng) => (
            <div className="table-row" key={eng.id}>
              <span>{eng.name}</span>
              <span>{eng.model_type}</span>
              <span>{eng.status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function CreateEngagement({ onCreated }) {
  const [form, setForm] = useState({
    name: "New Hybrid Portfolio",
    description: "Local prototype portfolio for hybrid FSO/FSP planning.",
    sponsorLabel: "Public sponsor portfolio",
    crmSystem: "Salesforce",
    pricingTools: "NEO, Excel",
    contractRepository: "SharePoint",
    resourceManagementSystem: "RMS, SMT",
    hrTalentSystem: "Workday",
    financeSystems: "OPF, Oracle",
    biTools: "Power BI",
    dataLakeAvailable: true,
  });
  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    onCreated(await api.post("/api/engagements", form));
  }
  return (
    <main className="workspace">
      <PageTitle eyebrow="New portfolio" title="Create a database-backed portfolio" subtitle="Capture enough systems context to shape the portfolio operating model." />
      <form className="form-grid panel" onSubmit={submit}>
        {[
          ["name", "Portfolio name"],
          ["description", "Description"],
          ["sponsorLabel", "Sponsor/client label"],
          ["crmSystem", "CRM/opportunity system"],
          ["pricingTools", "Pricing tools"],
          ["contractRepository", "Contract repository"],
          ["resourceManagementSystem", "Resource management"],
          ["hrTalentSystem", "HR/talent system"],
          ["financeSystems", "Finance/billing systems"],
          ["biTools", "BI/dashboard tools"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input value={form[key] || ""} onChange={(event) => update(key, event.target.value)} />
          </label>
        ))}
        <label className="check-row">
          <input type="checkbox" checked={form.dataLakeAvailable} onChange={(event) => update("dataLakeAvailable", event.target.checked)} />
          Data lake or integration layer available
        </label>
        <button className="button primary">Create portfolio</button>
      </form>
    </main>
  );
}

function Dashboard({ payload, nav }) {
  const { engagement, metrics, notifications, tasks, processZones } = payload;
  const [portfolio, setPortfolio] = useState(emptyPortfolio);
  const portfolioMetrics = metrics.filter((m) => !m.process_zone_id).slice(0, 4);
  const serviceSummary = buildServiceLineSummary(portfolio);

  useEffect(() => {
    api.get(`/api/portfolio/${engagement.id}`).then(setPortfolio).catch(console.error);
  }, [engagement.id]);

  const zoneMetricSummary = processZones.reduce((acc, zone) => {
    acc[zone.id] = {
      metricCount: metrics.filter((item) => item.process_zone_id === zone.id).length,
      actionCount: tasks.filter((item) => item.process_zone_id === zone.id).length,
    };
    return acc;
  }, {});
  const openZone = (zoneId) => {
    nav.setActiveZoneId(zoneId);
    nav.setView("zone");
  };
  const openServiceLine = (serviceLine) => {
    nav.setActiveServiceLine(serviceLine);
    nav.setView("serviceLine");
  };
  return (
    <main className="workspace">
      <PageTitle eyebrow="Portfolio health" title={engagement.name} subtitle={engagement.description} />
      <section className="portfolio-health-card">
        <div>
          <span>Portfolio-level health</span>
          <strong>{payload.portfolioHealth}%</strong>
          <p>Calculated from the health levels of all process zones across the portfolio.</p>
        </div>
        <div className="health-ring" style={{ "--score": `${payload.portfolioHealth * 3.6}deg` }}>
          <span>{payload.portfolioHealth}</span>
        </div>
      </section>
      <div className="metric-strip">
        {portfolioMetrics.map((metric) => (
          <MetricCard
            metric={metric}
            key={metric.id}
            onAction={() => nav.openMetricDialog({ metric, processZoneId: "" })}
          />
        ))}
      </div>
      <section className="service-line-grid" aria-label="Service line portfolio summary">
        <ServiceLineCard summary={serviceSummary.fso} onOpen={() => openServiceLine("fso")} />
        <ServiceLineCard summary={serviceSummary.fsp} onOpen={() => openServiceLine("fsp")} />
      </section>
      <div className="dashboard-grid">
        <section className="panel span-2">
          <div className="panel-title"><Activity size={18} /> Process-zone health</div>
          <div className="gauge-grid">
            {processZones.map((zone) => (
              <ZoneGauge zone={zone} key={zone.id} onOpen={() => openZone(zone.id)} />
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-title"><Bell size={18} /> Notifications</div>
          <Stack items={notifications} render={(item) => <AlertItem item={item} />} />
        </section>
      </div>
      <section className="panel full-width-section">
        <div className="panel-title"><ClipboardList size={18} /> Priority actions</div>
        <div className="action-card-grid">
          {tasks.map((item) => (
            <TaskItem
              item={item}
              key={item.id}
              onAction={() => nav.openMetricDialog({
                processZoneId: item.process_zone_id,
                metric: taskToMetric(item),
              })}
            />
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="panel-title"><BarChart3 size={18} /> Process zones</div>
        <div className="zone-grid">
          {processZones.map((zone) => (
            <article
              className="zone-tile"
              key={zone.id}
              role="button"
              tabIndex={0}
              onClick={() => openZone(zone.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openZone(zone.id);
                }
              }}
            >
              <span className="zone-accent" style={{ background: zone.accent }} />
              <button
                type="button"
                className="metric-action action-comment zone-card-action"
                onClick={(event) => {
                  event.stopPropagation();
                  nav.openMetricDialog({
                    processZoneId: zone.id,
                    metric: zoneToMetric(zone, zoneMetricSummary[zone.id]),
                  });
                }}
                title="Comment or assign"
              >
                <MessageSquare size={15} />
              </button>
              <strong>{zone.name}</strong>
              <div className="zone-metric-grid">
                <span><b>{zone.health_score}%</b><small>Health</small></span>
                <span><b>{zoneMetricSummary[zone.id]?.metricCount || 0}</b><small>KPIs</small></span>
                <span><b>{zoneMetricSummary[zone.id]?.actionCount || 0}</b><small>Actions</small></span>
                <span><b>{`L${zone.current_maturity} to L${zone.target_maturity}`}</b><small>Maturity</small></span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ZoneDashboard({ payload, zoneId, nav }) {
  const zone = payload.processZones.find((item) => item.id === zoneId) || payload.processZones[0];
  const metrics = payload.metrics.filter((item) => item.process_zone_id === zone.id);
  const tasks = payload.tasks.filter((item) => item.process_zone_id === zone.id);
  const ai = safeJson(zone.ai_enablers);
  const [details, setDetails] = useState({ studies: [], fspRequirements: [], tasks: [], comments: [] });

  useEffect(() => {
    api.get(`/api/portfolio/${payload.engagement.id}/zones/${zone.id}/details`).then(setDetails).catch(console.error);
  }, [payload.engagement.id, zone.id]);

  return (
    <main className="workspace">
      <PageTitle eyebrow="Process-zone dashboard" title={zone.name} subtitle={zone.value_statement} />
        <section className="panel">
          <div className="panel-title"><LayoutDashboard size={18} /> KPI dashboard</div>
          <div className="metric-grid">
            {metrics.map((metric) => (
              <MetricCard
                metric={metric}
                key={metric.id}
                onAction={() => nav.openMetricDialog({ metric, processZoneId: zone.id })}
              />
            ))}
          </div>
        </section>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title"><Bot size={18} /> AI enablers</div>
          <div className="chip-list">{ai.map((item) => <span className="chip" key={item}>{item}</span>)}</div>
        </section>
        <section className="panel">
          <div className="panel-title"><ClipboardList size={18} /> Actions</div>
          <Stack items={details.tasks.length ? details.tasks : tasks} render={(item) => <TaskItem item={item} />} empty="No open actions for this zone." />
        </section>
      </div>
      <section className="panel">
        <div className="panel-title"><ClipboardList size={18} /> Detailed data behind this zone</div>
        <div className="detail-split">
          <DetailList title="FSO studies" items={details.studies} empty="No FSO study records directly tied to this zone." />
          <DetailList title="FSP role/project requirements" items={details.fspRequirements} empty="No FSP role or project requirements directly tied to this zone." />
        </div>
      </section>
    </main>
  );
}

function DetailList({ title, items, empty }) {
  return (
    <div className="detail-list">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="empty">{empty}</p> : items.map((item) => (
        <article className="list-item" key={item.id}>
          <strong>{item.title}</strong>
          <span>{item.ai_recommendation}</span>
          <small>
            {item.nct_id ? `${item.nct_id} | ${item.status} | ${item.phase || "Phase TBD"}` : `${item.role_type} | ${item.status} | ${item.fte_need} FTE`}
          </small>
          <em>{item.process_zone_signal}</em>
        </article>
      ))}
    </div>
  );
}

function taskToMetric(item) {
  return {
    id: item.id,
    name: item.title,
    value: item.priority,
    unit: "",
    target: item.due_date,
    trend: item.status,
    description: item.description,
  };
}

function zoneToMetric(zone, summary = {}) {
  return {
    id: zone.id,
    name: `${zone.name} health`,
    value: `${zone.health_score}%`,
    unit: "",
    target: `L${zone.target_maturity}`,
    trend: `${summary.actionCount || 0} open actions`,
    description: zone.value_statement,
  };
}

function AgilePlan({ payload }) {
  return (
    <main className="workspace">
      <PageTitle eyebrow="Agile Plan" title="Generated implementation backlog" subtitle="Mock agent output generated from KPI comments and portfolio actions." />
      <div className="agile-board">
        {["Epic", "Feature", "Story"].map((type) => (
          <section className="panel" key={type}>
            <div className="panel-title"><ClipboardList size={18} /> {type}s</div>
            <Stack
              items={payload.agileItems.filter((item) => item.type === type)}
              render={(item) => (
                <article className="list-item">
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                  {item.acceptance_criteria && <small>AC: {item.acceptance_criteria}</small>}
                  <em>{item.priority}</em>
                </article>
              )}
            />
          </section>
        ))}
      </div>
    </main>
  );
}

function GlobalAiSearch() {
  return (
    <div className="global-ai-shell">
      <AiSearch compact />
    </div>
  );
}

function AiSearch({ compact = false }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Ask about portfolio health, FSO studies, FSP role needs, finance, resources, or contracts.");
  async function ask(event) {
    event.preventDefault();
    const result = await api.post("/api/ai-search", { question });
    setAnswer(`${result.answer} Citations: ${result.citations.join(", ")}.`);
  }
  return (
    <section className={`ai-search ${compact ? "compact" : ""}`}>
      <form onSubmit={ask}>
        <Search size={18} />
        <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask the portfolio agent..." />
        <button className="button primary">Ask</button>
      </form>
      <p>{answer}</p>
    </section>
  );
}

function ServiceLineCard({ summary, onOpen }) {
  return (
    <button className={`service-line-card ${summary.id}`} type="button" onClick={onOpen}>
      <span className="service-line-kicker">{summary.eyebrow}</span>
      <div className="service-line-card-head">
        <strong>{summary.title}</strong>
        <b>{summary.contractValue}</b>
      </div>
      <p>{summary.description}</p>
      <div className="service-line-card-metrics">
        <span><b>{summary.totalCount}</b><small>{summary.totalLabel}</small></span>
        <span><b>{summary.primaryValue}</b><small>{summary.primaryLabel}</small></span>
        <span><b>{summary.secondaryValue}</b><small>{summary.secondaryLabel}</small></span>
      </div>
      <div className="status-chip-row">
        {summary.statusRows.map((item) => (
          <span key={item.label}>{item.label} <b>{item.count}</b></span>
        ))}
      </div>
    </button>
  );
}

function ServiceLineDetail({ payload, serviceLine, nav }) {
  const [portfolio, setPortfolio] = useState(emptyPortfolio);

  useEffect(() => {
    api.get(`/api/portfolio/${payload.engagement.id}`).then(setPortfolio).catch(console.error);
  }, [payload.engagement.id]);

  const summary = buildServiceLineSummary(portfolio)[serviceLine] || buildServiceLineSummary(portfolio).fso;
  const isFso = serviceLine === "fso";
  const records = isFso ? portfolio.studies : portfolio.fspRequirements;
  const sponsorRows = buildSponsorServiceRows(portfolio, serviceLine);
  const signalRows = buildSignalRows(records);

  return (
    <main className="workspace">
      <PageTitle
        eyebrow={`${summary.title} service line`}
        title={`${summary.title} portfolio details`}
        subtitle={isFso
          ? "Full-service study portfolio view for sponsor exposure, study status, operational signals, and AI-guided actions."
          : "Functional-service requirement view for contracted work, staffing demand, geography, risk status, and AI-guided actions."}
      />
      <section className="portfolio-health-card service-line-hero">
        <div>
          <span>{summary.eyebrow}</span>
          <strong>{summary.contractValue}</strong>
          <p>{summary.description}</p>
        </div>
        <div className="service-line-hero-metrics">
          <span><b>{summary.totalCount}</b><small>{summary.totalLabel}</small></span>
          <span><b>{summary.primaryValue}</b><small>{summary.primaryLabel}</small></span>
          <span><b>{summary.secondaryValue}</b><small>{summary.secondaryLabel}</small></span>
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel span-2">
          <div className="panel-title"><Users size={18} /> Sponsor concentration</div>
          <div className="service-sponsor-grid">
            {sponsorRows.map((row) => (
              <article className="service-sponsor-card" key={row.id}>
                <strong>{row.name}</strong>
                <span>{row.contractValue}</span>
                <small>{row.recordLabel} | Risk score {row.riskScore}</small>
                <div className="status-chip-row">
                  {row.statusRows.map((item) => <span key={item.label}>{item.label} <b>{item.count}</b></span>)}
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="panel">
          <div className="panel-title"><Activity size={18} /> Process-zone signals</div>
          <Stack
            items={signalRows}
            empty="No process-zone signals yet."
            render={(item) => (
              <article className="list-item">
                <strong>{item.id}</strong>
                <span>{item.count} linked {isFso ? "studies" : "requirements"}</span>
                <em>{item.share}% of service line</em>
              </article>
            )}
          />
        </section>
      </div>
      <section className="panel">
        <div className="panel-title"><ClipboardList size={18} /> {isFso ? "FSO study portfolio" : "FSP requirement portfolio"}</div>
        <div className="study-table">
          <div className={`study-row service-detail-row header ${isFso ? "fso" : "fsp"}`}>
            <span>{isFso ? "Study ID" : "Req ID"}</span>
            <span>{isFso ? "Study / scope" : "Requirement / role"}</span>
            <span>Status</span>
            <span>{isFso ? "Timeline" : "Demand"}</span>
            <span>Portfolio manager signal</span>
            <span>AI recommendation</span>
          </div>
          {records.map((item) => (
            <div className={`study-row service-detail-row ${isFso ? "fso" : "fsp"}`} key={item.id}>
              <span>{isFso ? item.nct_id : item.id}</span>
              <span>
                {item.title}
                <small>{isFso ? `${item.phase} | ${item.condition} | Enrollment ${item.enrollment || "TBD"}` : `${item.role_type} | ${item.geography}`}</small>
              </span>
              <span>{item.status}</span>
              <span>{isFso ? `${item.start_date} to ${item.completion_date}` : `${item.fte_need} FTE | ${item.start_date} to ${item.end_date}`}</span>
              <span>{item.process_zone_signal}</span>
              <span>{item.ai_recommendation}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="panel full-width-section">
        <div className="panel-title"><Bot size={18} /> Portfolio manager focus</div>
        <div className="action-card-grid">
          {summary.managerFocus.map((item) => (
            <article className="list-item" key={item.title}>
              <strong>{item.title}</strong>
              <span>{item.detail}</span>
              <em>{item.priority}</em>
            </article>
          ))}
        </div>
      </section>
      <button className="button secondary" onClick={() => nav.setView("dashboard")}>Back to Portfolio Health</button>
    </main>
  );
}

function ZoneGauge({ zone, onOpen }) {
  const score = Math.max(0, Math.min(100, Number(zone.health_score || 0)));
  const needleRotation = score * 1.8 - 90;
  const tone = score >= 80 ? "good" : score >= 70 ? "watch" : "risk";

  return (
    <button
      className={`gauge-card ${tone}`}
      type="button"
      onClick={onOpen}
      style={{
        "--gauge-score": score,
        "--needle-rotation": `${needleRotation}deg`,
        "--zone-accent": zone.accent || "var(--primary)",
      }}
      aria-label={`${zone.name} health ${score}%`}
    >
      <span className="gauge-name">{zone.name}</span>
      <span className="gauge-dial" aria-hidden="true">
        <svg viewBox="0 0 120 78" role="img">
          <path className="gauge-track" pathLength="100" d="M10 66 A50 50 0 0 1 110 66" />
          <path
            className="gauge-progress"
            pathLength="100"
            d="M10 66 A50 50 0 0 1 110 66"
            strokeDasharray={`${score} 100`}
          />
        </svg>
        <span className="gauge-needle" />
        <span className="gauge-hub" />
        <span className="gauge-tick low">0</span>
        <span className="gauge-tick high">100</span>
      </span>
      <span className="gauge-value">{score}%</span>
    </button>
  );
}

function PageTitle({ eyebrow, title, subtitle }) {
  return (
    <section className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </section>
  );
}

function MetricMini({ label, value, tone }) {
  return (
    <div className={`metric-mini ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function MetricCard({ metric, onAction }) {
  return (
    <article className={`metric-card ${metric.status}`}>
      {onAction && (
        <button className="metric-action" onClick={onAction} title="Comment or assign KPI">
          <MessageSquare size={15} />
        </button>
      )}
      <span>{metric.name}</span>
      <strong>{metric.value}{metric.unit && metric.value.includes(metric.unit) ? "" : metric.unit}</strong>
      <small>Target {metric.target} | Trend {metric.trend}</small>
      <p>{metric.description}</p>
    </article>
  );
}

function MetricCommentDialog({ metric, processZoneId, portfolio, onClose, onSaved }) {
  const [commentText, setCommentText] = useState("");
  const [mode, setMode] = useState("comment");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  async function save(assign = false) {
    if (!commentText.trim()) return;
    if (assign && !email.trim()) {
      setMode("assign");
      setStatus("Enter an email address to assign this KPI comment.");
      return;
    }
    const result = await api.post("/api/kpi-comments", {
      engagementId: portfolio?.id || "eng-mock",
      portfolioName: portfolio?.name || "Portfolio",
      processZoneId,
      metricId: metric.id,
      metricName: metric.name,
      commentText,
      assigneeEmail: assign ? email : "",
      author: "Organizer",
    });
    setStatus(result.email ? `Saved and queued email notification to ${email}.` : "Saved.");
    setTimeout(onSaved, 450);
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <section className="dialog">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">KPI comment</p>
            <h2>{metric.name}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>x</button>
        </div>
        <p className="dialog-context">Value {metric.value}{metric.unit} | Target {metric.target} | Trend {metric.trend}</p>
        <label>
          Comment
          <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Enter your comment or action note for this KPI..." />
        </label>
        {mode === "assign" && (
          <label>
            Assign to email
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
          </label>
        )}
        {status && <p className="dialog-status">{status}</p>}
        <div className="dialog-actions">
          <button className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button secondary" onClick={() => save(false)}>Save</button>
          {mode === "assign" ? (
            <button className="button primary" onClick={() => save(true)}>Send</button>
          ) : (
            <button className="button primary" onClick={() => setMode("assign")}>Assign to</button>
          )}
        </div>
      </section>
    </div>
  );
}

function Stack({ items, render, empty = "No records yet." }) {
  if (!items?.length) return <p className="empty">{empty}</p>;
  return <div className="stack">{items.map((item) => <React.Fragment key={item.id}>{render(item)}</React.Fragment>)}</div>;
}

function AlertItem({ item }) {
  return (
    <article className={`list-item severity-${item.severity?.toLowerCase()}`}>
      <strong>{item.title}</strong>
      <span>{item.message}</span>
      <em>{item.severity}</em>
    </article>
  );
}

function TaskItem({ item, onAction }) {
  return (
    <article className="list-item">
      {onAction && (
        <button className="metric-action action-comment" onClick={onAction} title="Comment or assign">
          <MessageSquare size={15} />
        </button>
      )}
      <strong>{item.title}</strong>
      <span>{item.description}</span>
      <small>{item.owner} | Due {item.due_date}</small>
      <em>{item.priority}</em>
    </article>
  );
}

function buildServiceLineSummary(portfolio = emptyPortfolio) {
  const studies = portfolio.studies || [];
  const fspRequirements = portfolio.fspRequirements || [];
  const sponsorValue = totalSponsorValue(portfolio.sponsors || []);
  const fsoStatuses = countBy(studies, (item) => item.status);
  const fspStatuses = countBy(fspRequirements, (item) => item.status);
  const activeStudies = (fsoStatuses.ACTIVE || 0) + (fsoStatuses.RECRUITING || 0);
  const fspFte = fspRequirements.reduce((sum, item) => sum + Number(item.fte_need || 0), 0);
  const contractedFsp = fspRequirements.filter((item) => !["Open", "Rejected"].includes(item.status)).length;

  return {
    fso: {
      id: "fso",
      eyebrow: "Full-service outsourcing",
      title: "FSO",
      description: "Full-service clinical study accountability across sponsor portfolios, study status, scope signals, and contract value exposure.",
      contractValue: formatMoney(sponsorValue),
      totalLabel: "FSO studies",
      totalCount: studies.length,
      primaryLabel: "Active / recruiting",
      primaryValue: activeStudies,
      secondaryLabel: "Sponsors",
      secondaryValue: portfolio.sponsors?.length || 0,
      statusRows: [
        { label: "Recruiting", count: fsoStatuses.RECRUITING || 0 },
        { label: "Active", count: fsoStatuses.ACTIVE || 0 },
        { label: "Completed", count: fsoStatuses.COMPLETED || 0 },
      ],
      managerFocus: [
        { title: "Scope drift and amendment readiness", detail: "Review studies tied to Oversight & Scope Changes and Contracts & Amendments before month-close governance.", priority: "High" },
        { title: "Resource pressure", detail: "Watch active and recruiting studies with Resource Management or Talent Acquisition signals for CRA, writing, and site support demand.", priority: "High" },
        { title: "Financial closeout", detail: "Use completed studies to validate forecast-to-actual, billing exceptions, and residual obligations.", priority: "Medium" },
        { title: "Sponsor concentration", detail: "Compare sponsor value, active study count, and risk score before prioritizing steering committee actions.", priority: "Medium" },
      ],
    },
    fsp: {
      id: "fsp",
      eyebrow: "Functional-service provider",
      title: "FSP",
      description: "Functional-service requirements by sponsor, role family, geography, FTE demand, contracting state, and execution risk.",
      contractValue: formatMoney(sponsorValue),
      totalLabel: "FSP requirements",
      totalCount: fspRequirements.length,
      primaryLabel: "Under contract",
      primaryValue: contractedFsp,
      secondaryLabel: "FTE demand",
      secondaryValue: fspFte.toFixed(1),
      statusRows: [
        { label: "Open", count: fspStatuses.Open || 0 },
        { label: "In progress", count: fspStatuses["In progress"] || 0 },
        { label: "At risk", count: fspStatuses["At risk"] || 0 },
        { label: "Rejected", count: fspStatuses.Rejected || 0 },
      ],
      managerFocus: [
        { title: "Contracting throughput", detail: "Separate open requirements from under-contract work so finance, staffing, and delivery owners see the same demand picture.", priority: "High" },
        { title: "At-risk capacity", detail: "Prioritize role requirements marked at risk, especially where geography and FTE demand constrain fulfillment.", priority: "High" },
        { title: "Utilization and margin control", detail: "Track variable FTE work against billing and utilization assumptions to avoid under-recovery.", priority: "Medium" },
        { title: "Role-family demand", detail: "Use role type, geography, and dates to shape recruiting, internal matching, and external sourcing decisions.", priority: "Medium" },
      ],
    },
  };
}

function buildSponsorServiceRows(portfolio = emptyPortfolio, serviceLine = "fso") {
  const records = serviceLine === "fso" ? portfolio.studies || [] : portfolio.fspRequirements || [];
  return (portfolio.sponsors || []).map((sponsor) => {
    const sponsorRecords = records.filter((item) => item.sponsor_id === sponsor.id);
    const statuses = countBy(sponsorRecords, (item) => item.status);
    const fte = sponsorRecords.reduce((sum, item) => sum + Number(item.fte_need || 0), 0);
    const statusRows = serviceLine === "fso"
      ? [
          { label: "Recruiting", count: statuses.RECRUITING || 0 },
          { label: "Active", count: statuses.ACTIVE || 0 },
          { label: "Completed", count: statuses.COMPLETED || 0 },
        ]
      : [
          { label: "Open", count: statuses.Open || 0 },
          { label: "In progress", count: statuses["In progress"] || 0 },
          { label: "At risk", count: statuses["At risk"] || 0 },
        ];
    return {
      id: sponsor.id,
      name: sponsor.name,
      riskScore: sponsor.risk_score,
      contractValue: sponsor.portfolio_value,
      recordLabel: serviceLine === "fso" ? `${sponsorRecords.length} studies` : `${sponsorRecords.length} reqs | ${fte.toFixed(1)} FTE`,
      statusRows,
    };
  });
}

function buildSignalRows(records = []) {
  const counts = countBy(records, (item) => item.process_zone_signal || "Unassigned");
  return Object.entries(counts)
    .map(([id, count]) => ({ id, count, share: records.length ? Math.round((count / records.length) * 100) : 0 }))
    .sort((a, b) => b.count - a.count);
}

function countBy(items = [], getKey) {
  return items.reduce((acc, item) => {
    const key = getKey(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function totalSponsorValue(sponsors = []) {
  return sponsors.reduce((sum, sponsor) => sum + parseMoney(sponsor.portfolio_value), 0);
}

function parseMoney(value) {
  const text = String(value || "").trim().replace("$", "");
  const number = Number.parseFloat(text);
  if (Number.isNaN(number)) return 0;
  if (text.toUpperCase().includes("B")) return number * 1000;
  return number;
}

function formatMoney(valueInMillions) {
  if (valueInMillions >= 1000) return `$${(valueInMillions / 1000).toFixed(1)}B`;
  return `$${valueInMillions.toFixed(1)}M`;
}

function safeJson(value) {
  try {
    return JSON.parse(value || "[]");
  } catch {
    return [];
  }
}

createRoot(document.getElementById("root")).render(<App />);
