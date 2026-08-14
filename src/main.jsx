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
  ExternalLink,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Newspaper,
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
import { api, isStaticMode } from "./api";

const emptyPortfolio = { sponsors: [], studies: [], fspRequirements: [], source: "" };
const CONTACT_EMAIL = "contact@r2dw.com";
const DEEP_DIVE_MESSAGE = "I'd like to request a deep dive session for my organization.";

const landingFaqs = [
  {
    question: "How do I start using the portfolio command center?",
    answer: "Choose Get started to request a deep dive session with the StratHub360 team. To explore immediately, open the mock portfolio and review the hybrid FSO-FSP workflows.",
  },
  {
    question: "What does the Portfolio Health page show?",
    answer: "It summarizes overall health, process-zone KPIs, alerts, actions, service-line views, and AI-supported recommendations for hybrid delivery governance.",
  },
  {
    question: "How do I compare FSO and FSP work?",
    answer: "Open the FSO or FSP service-line cards from Portfolio Health. Each view separates studies, role requirements, sponsor concentration, demand signals, and manager focus areas.",
  },
  {
    question: "How do process zones help my team?",
    answer: "Process zones organize work around scoping, contracts, resources, talent, people, finance, and oversight so teams can manage handoffs and maturity in one place.",
  },
  {
    question: "Can I add comments or assign KPI follow-ups?",
    answer: "Yes. Use the comment icon on KPI cards or task items to save an action note and optionally assign it by email. In this prototype, emails are queued in the local outbox.",
  },
  {
    question: "What can the portfolio AI search answer?",
    answer: "The AI search bar answers from seeded portfolio context, including scope drift, resource allocation, finance, contract readiness, and operational risks.",
  },
  {
    question: "How do I export portfolio data?",
    answer: "Use the export option in the portfolio workspace to generate an Excel workbook with KPIs, comments, FSO studies, FSP requirements, and agile plan items.",
  },
  {
    question: "Where should I read market updates?",
    answer: "Open Industry News from the landing page or header. It shows curated external reference cards plus a discussion area for posts and comments.",
  },
];

const industryNews = [
  {
    id: "ppd-ai-leader-2026",
    category: "AI in CRO delivery",
    date: "May 6, 2026",
    source: "PPD / Thermo Fisher Scientific",
    title: "Thermo Fisher Scientific's Clinical Research Business Named a Leader Among CROs in 2026 ISG Provider Lens Report for Use of AI in Clinical Trials",
    summary: "PPD highlights AI-enabled clinical development, data-driven patient engagement, pharmacovigilance, and regulatory affairs as differentiators for the next generation CRO model.",
    relevance: "Shows how major CROs are embedding AI across clinical development, patient engagement, safety, and regulatory workflows.",
    href: "https://www.ppd.com/news-item/thermo-fisher-leader-cro-2026-isg-provider-lens-ai-clinical-trials/",
  },
  {
    id: "bms-anthropic-2026",
    category: "Enterprise pharma AI",
    date: "May 20, 2026",
    source: "Bristol Myers Squibb",
    title: "Bristol Myers Squibb Announces Strategic Agreement with Anthropic to Position Claude Enterprise as the Shared Intelligence Platform Across Its Global Operations",
    summary: "BMS says it will deploy Claude broadly to more than 30,000 employees across research, clinical development, manufacturing, commercial, and corporate functions.",
    relevance: "Signals large-scale pharma implementation of AI agents inside clinical, regulatory, data science, and operational workflows.",
    href: "https://news.bms.com/news/corporate-financial/2026/Bristol-Myers-Squibb-Announces-Strategic-Agreement-with-Anthropic-to-Position-Claude-Enterprise-as-the-Shared-Intelligence-Platform-Across-Its-Global-Operations/default.aspx",
  },
  {
    id: "pharmaphorum-hybrid-fsp-fso",
    category: "Hybrid FSP-FSO strategy",
    date: "October 2025",
    source: "pharmaphorum",
    title: "Staying on course: How hybrid FSP/FSO models are shaping clinical development",
    summary: "The article frames hybrid FSP/FSO as a response to trial complexity, cost pressure, patient burden, and sponsor demand for flexibility and control.",
    relevance: "Directly supports the portfolio strategy of governing FSO, FSP, and hybrid delivery as one operating model.",
    href: "https://pharmaphorum.com/rd/staying-course-how-hybrid-fspfso-models-are-shaping-clinical-development",
  },
  {
    id: "ppd-fsp-trends-2025",
    category: "FSP market trends",
    date: "May 9, 2025",
    source: "PPD / Thermo Fisher Scientific",
    title: "The 2025 State of FSP Outsourcing: Challenges, Trends and Opportunities, and the Future of FSP Strategies and Models",
    summary: "PPD reports increased sponsor reliance on FSP partnerships and hybrid or mixed models to manage trial complexity, cost, innovation, and on-time performance.",
    relevance: "Provides market evidence for why CROs need portfolio tooling that can coordinate functions, roles, resources, and full-service studies.",
    href: "https://www.ppd.com/blog/fsp-outsourcing-challenges-trends-opportunities-2025/",
  },
  {
    id: "merative-ai-trends-2026",
    category: "Clinical trial AI use cases",
    date: "February 4, 2026",
    source: "Merative",
    title: "Trends for 2026: Targeted AI, continuous trials, and navigating uncertainty",
    summary: "Merative expects use-case-led AI adoption in protocol automation, study database configuration, protocol change management, and risk-based validation.",
    relevance: "Maps cleanly to AI use cases for protocol interpretation, traceability, quality, validation, and downstream study operations.",
    href: "https://www.merative.com/blog/clinical-trial-trends-2026",
  },
  {
    id: "novo-openai-2026",
    category: "Enterprise pharma AI",
    date: "April 14, 2026",
    source: "BioPharm International",
    title: "Novo Nordisk Partners with OpenAI for Drug Discovery",
    summary: "Coverage of Novo Nordisk's partnership with OpenAI to integrate AI capabilities across global operations, from early discovery through manufacturing and commercial execution.",
    relevance: "Shows pharma sponsors moving from isolated AI pilots toward enterprise programs spanning R&D, clinical, operations, and commercialization.",
    href: "https://www.biopharminternational.com/view/novo-nordisk-partners-with-openai",
  },
];

const seededIndustryPosts = [
  {
    id: "post-1",
    email: "maya.ops@strathub360.com",
    content: "Hybrid delivery works best when the portfolio view is model-neutral. I like that this app shows FSO studies and FSP role demand side by side, because the governance question is usually about shared capacity, scope boundaries, and financial exposure rather than labels.",
    comments: [
      { id: "comment-1", email: "raj.pm@strathub360.com", text: "Agreed. The service-line split helps without hiding the shared risk signals." },
    ],
  },
  {
    id: "post-2",
    email: "elena.ai@strathub360.com",
    content: "The strongest AI use case here may be demand translation. If the app can map scope, geography, dates, and skills into FTE needs, it can reduce several downstream issues in staffing, pricing, and billing before they become escalations.",
    comments: [],
  },
  {
    id: "post-3",
    email: "noah.finance@strathub360.com",
    content: "Finance teams need early visibility into hybrid obligations. A single dashboard for contract boundaries, resource assumptions, and forecast accuracy would make month-end reviews much less reactive.",
    comments: [],
  },
  {
    id: "post-4",
    email: "priya.talent@strathub360.com",
    content: "The talent acquisition workflow should prioritize internal-first matching for fractional FSP needs. Small assignments are often hard to fill externally, but they are perfect for borrowable talent if manager approvals are visible.",
    comments: [],
  },
  {
    id: "post-5",
    email: "sam.governance@strathub360.com",
    content: "The Industry News page is useful context for executive steering discussions. It connects the operating model changes to what large CROs and pharma companies are already doing with AI and flexible outsourcing.",
    comments: [],
  },
];

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
  const [contactRequest, setContactRequest] = useState(null);

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
  const portfolioViews = ["dashboard", "zone", "agile", "serviceLine"];
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
        onContact={() => setContactRequest({ purpose: "general" })}
      />
      {showAiSearch && <GlobalAiSearch />}
      {loading && <div className="loading-line" />}
      {view === "landing" && <Landing onContact={() => setContactRequest({ purpose: "deep-dive" })} onMock={() => loadEngagement("eng-mock")} onNews={() => goTo("industryNews")} />}
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
      {view === "portfolio" && payload && <Dashboard payload={payload} nav={nav} />}
      {view === "agile" && payload && <AgilePlan payload={payload} nav={nav} />}
      {view === "industryNews" && <IndustryNews />}
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
      {contactRequest && <ContactDialog purpose={contactRequest.purpose} onClose={() => setContactRequest(null)} />}
      <footer className="app-footer">
        <span>Clinical Portfolio Management Solutions</span>
        <span>{isStaticMode ? "Public demo · changes stay in this browser" : "Local prototype with file-backed database"}</span>
      </footer>
    </div>
  );
}

function TopBar({ theme, toggleTheme, user, view, setView, canGoBack, goBack, onContact }) {
  const showWorkspaceNav = user && view !== "landing";
  const navItems = showWorkspaceNav
    ? [
        ["home", "Home"],
        ["dashboard", "Portfolio Health"],
      ]
    : [];
  const activeNavIndex = Math.max(0, navItems.findIndex(([id]) => id === view));

  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => setView("landing")} aria-label="Go to landing">
        <span className="brand-mark">CP</span>
        <span>
          <strong>Clinical Portfolio Management Solutions</strong>
          <small>Portfolio Command Center</small>
        </span>
      </button>
      {showWorkspaceNav && (
        <button className="button secondary nav-back" onClick={goBack} disabled={!canGoBack}>
          <ChevronRight size={16} className="back-chevron" /> Back
        </button>
      )}
      {showWorkspaceNav && (
        <nav className="nav-links" style={{ "--active-index": activeNavIndex, "--nav-count": navItems.length }}>
          <span className="nav-glider" aria-hidden="true" />
          {navItems.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} className={view === id ? "active" : ""}>
              {label}
            </button>
          ))}
        </nav>
      )}
      <div className="top-actions">
        <button className={view === "industryNews" ? "button secondary" : "button ghost"} onClick={() => setView("industryNews")}>Industry</button>
        <button className="button ghost" onClick={onContact}>Contact Us</button>
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
    </main>
  );
}

function PortfolioSignalSections({ portfolio, processZones = [], onAction }) {
  return (
    <>
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
            <div className="study-row signal-card" key={study.id}>
              {onAction && (
                <button
                  className="metric-action action-comment"
                  onClick={() => onAction(study, "FSO study")}
                  title="Comment or assign"
                >
                  <MessageSquare size={15} />
                </button>
              )}
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
            <div className="study-row signal-card" key={item.id}>
              {onAction && (
                <button
                  className="metric-action action-comment"
                  onClick={() => onAction(item, "FSP requirement")}
                  title="Comment or assign"
                >
                  <MessageSquare size={15} />
                </button>
              )}
              <span>{item.id}</span>
              <span>{item.title}<small>{item.role_type} | {item.geography} | {item.fte_need} FTE | {item.start_date} to {item.end_date}</small></span>
              <span>{item.status}</span>
              <span>{item.process_zone_signal}</span>
              <span>{item.ai_recommendation}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function Landing({ onContact, onMock, onNews }) {
  return (
    <main className="landing">
      <section className="hero ai-saas-hero">
        <div className="hero-copy">
          <p className="announcement"><Sparkles size={14} /> AI-first operating layer for hybrid clinical delivery</p>
          <p className="eyebrow">Unified FSO-FSP portfolio management</p>
          <h1>One portfolio command center for every delivery model.</h1>
          <p className="hero-subtitle">
            Bring full-service accountability, functional-service flexibility, and hybrid programs into one AI-powered
            platform so CRO leaders can manage operations at the portfolio level instead of chasing siloed workflows.
          </p>
          <div className="hero-actions">
            <button className="button primary" onClick={onContact}>Get started</button>
            <button className="button secondary" onClick={onMock}>View Mock Portfolio</button>
            <button className="button ghost" onClick={onNews}>Industry News</button>
          </div>
        </div>
        <AIPortfolioAnimation />
      </section>
      <DeliveryModelSection />
      <OpsImpactSection />
      <ProcessZoneSection />
      <AiUseCaseSection />
      <RoadmapSection />
      <FaqSection />
    </main>
  );
}

function IndustryNews() {
  const hybridCount = industryNews.filter((item) => item.category.includes("FSP")).length;
  const aiCount = industryNews.filter((item) => item.category.includes("AI")).length;
  const [posts, setPosts] = useState(seededIndustryPosts);
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});

  function addPost(post) {
    setPosts((current) => [post, ...current]);
    setExpandedPostId(post.id);
  }

  function addComment(postId) {
    const draft = commentDrafts[postId] || { email: "", text: "" };
    if (!draft.email.trim() || !draft.text.trim()) return;
    setPosts((current) => current.map((post) => (
      post.id === postId
        ? {
            ...post,
            comments: [
              ...post.comments,
              { id: `comment-${Date.now()}`, email: draft.email.trim(), text: draft.text.trim() },
            ],
          }
        : post
    )));
    setCommentDrafts((current) => ({ ...current, [postId]: { email: draft.email, text: "" } }));
  }

  return (
    <main className="workspace industry-news-page">
      <PageTitle
        eyebrow="Industry news"
        title="Hybrid FSO-FSP strategy and AI implementation signals"
        subtitle="A curated reference board of recent external articles tracking how CROs and pharma companies are pursuing hybrid delivery models, functional-service growth, and practical AI implementation across clinical development."
      />
      <div className="metric-strip">
        <MetricMini label="External references" value={String(industryNews.length)} tone="good" />
        <MetricMini label="Hybrid FSP-FSO signals" value={String(hybridCount)} tone="watch" />
        <MetricMini label="AI implementation signals" value={String(aiCount)} tone="good" />
        <MetricMini label="Updated through" value="Jun 2026" tone="watch" />
      </div>
      <section className="news-hero-panel">
        <div>
          <p className="eyebrow">What to watch</p>
          <h2>Outsourcing strategy and AI are converging into one operating-model question.</h2>
          <p>
            Sponsors are mixing FSO accountability with FSP flexibility while CROs and pharma teams push AI from pilots into protocol, data, regulatory, patient engagement, and portfolio workflows.
          </p>
        </div>
        <div className="news-signal-grid">
          <span><Newspaper size={18} /> Hybrid delivery</span>
          <span><Bot size={18} /> Agentic AI</span>
          <span><ShieldCheck size={18} /> Quality and compliance</span>
          <span><Users size={18} /> Workforce enablement</span>
        </div>
      </section>
      <section className="news-card-grid" aria-label="Industry news reference cards">
        {industryNews.map((item) => (
          <a className="news-card" href={item.href} target="_blank" rel="noreferrer" key={item.id}>
            <span className="news-card-kicker">{item.category}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
            <div className="news-card-relevance">
              <strong>Why it matters</strong>
              <span>{item.relevance}</span>
            </div>
            <div className="news-card-footer">
              <span>{item.source} | {item.date}</span>
              <ExternalLink size={16} />
            </div>
          </a>
        ))}
      </section>
      <section className="industry-posts-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Community posts</p>
            <h2>Discuss what these trends mean for hybrid portfolio operations.</h2>
          </div>
          <button className="button primary" onClick={() => setPostDialogOpen(true)}>Create a Post</button>
        </div>
        <div className="post-list">
          {posts.map((post) => {
            const expanded = expandedPostId === post.id;
            const draft = commentDrafts[post.id] || { email: "", text: "" };
            return (
              <article className={`post-row ${expanded ? "expanded" : ""}`} key={post.id}>
                <button className="post-summary" onClick={() => setExpandedPostId(expanded ? null : post.id)}>
                  <strong>{displayName(post.email)}</strong>
                  <span>{previewLines(post.content)}</span>
                  <em>{post.comments.length} comments</em>
                </button>
                {expanded && (
                  <div className="post-detail">
                    <p>{post.content}</p>
                    <div className="comment-list">
                      {post.comments.length ? post.comments.map((comment) => (
                        <article className="comment-item" key={comment.id}>
                          <strong>{displayName(comment.email)}</strong>
                          <span>{comment.text}</span>
                        </article>
                      )) : <p className="empty">No comments yet.</p>}
                    </div>
                    <div className="comment-compose">
                      <input
                        value={draft.email}
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: { ...draft, email: event.target.value } }))}
                        placeholder="Your email"
                      />
                      <textarea
                        value={draft.text}
                        onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: { ...draft, text: event.target.value } }))}
                        placeholder="Add a comment..."
                      />
                      <button className="button secondary" onClick={() => addComment(post.id)}>Comment</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
      {postDialogOpen && <CreatePostDialog onClose={() => setPostDialogOpen(false)} onCreate={addPost} />}
    </main>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="faq-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FAQ</p>
          <h2>How to use this web app.</h2>
        </div>
      </div>
      <div className="faq-list">
        {landingFaqs.map((item, index) => (
          <article className="faq-item" key={item.question}>
            <button onClick={() => setOpenIndex(openIndex === index ? -1 : index)}>
              <span>{item.question}</span>
              <ChevronRight size={18} className={openIndex === index ? "open" : ""} />
            </button>
            {openIndex === index && <p>{item.answer}</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function CreatePostDialog({ onClose, onCreate }) {
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const words = wordCount(content);
  const canSubmit = email.trim() && content.trim() && words <= 300;

  function submit() {
    if (!canSubmit) return;
    onCreate({
      id: `post-${Date.now()}`,
      email: email.trim(),
      content: content.trim(),
      comments: [],
    });
    onClose();
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <section className="dialog">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Create a post</p>
            <h2>Share an industry perspective</h2>
          </div>
          <button className="icon-button" onClick={onClose}>x</button>
        </div>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
        </label>
        <label>
          Post content
          <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write up to 300 words..." />
        </label>
        <p className={words > 300 ? "dialog-status risk-text" : "dialog-status"}>{words}/300 words</p>
        <div className="dialog-actions">
          <button className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" onClick={submit} disabled={!canSubmit}>Create Post</button>
        </div>
      </section>
    </div>
  );
}

function ContactDialog({ purpose, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(purpose === "deep-dive" ? DEEP_DIVE_MESSAGE : "");
  const [status, setStatus] = useState("");
  const canSubmit = email.trim() && message.trim();

  function submit() {
    if (!canSubmit) return;
    const subject = purpose === "deep-dive" ? "StratHub360 deep dive session request" : "StratHub360 contact request";
    const body = `Reply to: ${email.trim()}\n\n${message.trim()}`;
    window.location.assign(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    setStatus(`Your email app is opening with a message addressed to ${CONTACT_EMAIL}. Review it, then send.`);
  }

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <section className="dialog">
        <div className="dialog-header">
          <div>
            <p className="eyebrow">Contact Us</p>
            <h2>{purpose === "deep-dive" ? "Request a deep dive session" : "Send a message to StratHub360"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>x</button>
        </div>
        <p className="dialog-context">Your email will be addressed to {CONTACT_EMAIL}.</p>
        <label>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
        </label>
        <label>
          Message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="How can we help?" />
        </label>
        {status && <p className="dialog-status">{status}</p>}
        <div className="dialog-actions">
          <button className="button secondary" onClick={onClose}>Cancel</button>
          <button className="button primary" onClick={submit} disabled={!canSubmit}>Continue to Email</button>
        </div>
      </section>
    </div>
  );
}

function DeliveryModelSection() {
  const models = [
    ["FSP", "Functional Service Provider", "Role and function-specific outsourcing embedded in sponsor operations for skill gaps, volume needs, and local delivery."],
    ["Hybrid", "Mixed-Model Portfolio Delivery", "A deliberate combination of FSO and FSP services optimized by function, study type, geography, and strategic importance."],
    ["FSO", "Full Service Outsourcing", "End-to-end clinical trial delivery with CRO-owned accountability for program execution, quality, milestones, and outcomes."],
  ];
  return (
    <section className="delivery-band">
      <div className="section-heading">
        <div>
          <p className="eyebrow">One delivery portfolio</p>
          <h2>Multiple delivery models, governed as one operating system.</h2>
        </div>
        <p>
          The platform preserves each model's strengths while creating shared visibility for scope, pricing,
          resources, talent, finance, and oversight.
        </p>
      </div>
      <div className="model-grid">
        {models.map(([label, title, body], index) => (
          <article className={`model-card model-${index + 1}`} key={label}>
            <span>{label}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProcessZoneSection() {
  const zones = [
    ["A", "Scoping & Pricing", "Dynamic pricing intelligence and automated RFP scoping turn inconsistent opportunity data into repeatable commercial decisions."],
    ["B", "Contracts & Amendments", "Clause intelligence and scope drift warnings reduce ambiguity, revenue leakage, and amendment lag."],
    ["C", "Resource Management", "A single supply-demand view supports intelligent matching, predictive forecasting, and cross-model utilization balance."],
    ["D", "Talent Acquisition", "AI skills matching prioritizes THRIVE/RISE mobility, hybrid intake compliance, and faster role placement."],
    ["E", "People Management", "Matrix governance, onboarding pathways, and retention monitoring support employees moving across FSO and FSP."],
    ["F", "Finance & Revenue", "Revenue recognition and billing anomaly controls connect hybrid obligations to clean financial reporting."],
    ["G", "Program Oversight", "Integrated health scoring combines delivery, risk, scope, resource, and finance signals for proactive governance."],
  ];
  return (
    <section className="section zone-story-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Seven process zones</p>
          <h2>From siloed execution to portfolio-level control.</h2>
        </div>
        <p>
          Each zone moves from defined or standardized process maturity toward integrated operations first,
          then optimized AI enablement as the data foundation matures.
        </p>
      </div>
      <div className="landing-zone-grid">
        {zones.map(([letter, title, body]) => (
          <article className="landing-zone-card" key={letter}>
            <span>{letter}</span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AiUseCaseSection() {
  const cases = [
    ["Pricing & Scoping", "Recommend optimal hybrid pricing and extract FSO/FSP scope from RFPs."],
    ["Resource AI", "Match employees to hybrid demand using skills, experience, availability, and model eligibility."],
    ["People Intelligence", "Detect attrition risk and personalize onboarding for cross-model transitions."],
    ["Financial Controls", "Flag revenue recognition anomalies, billing gaps, rate-card mismatches, and duplicate charges."],
    ["Delivery Oversight", "Detect scope drift and generate program health scores with recommended escalation paths."],
  ];
  return (
    <section className="ai-use-case-band">
      <div className="ai-use-case-copy">
        <p className="eyebrow">AI-first operating model</p>
        <h2>AI is the connective layer across every process zone.</h2>
        <p>
          The platform turns CRM, contract, resourcing, HR, finance, BI, and delivery data into a shared portfolio
          intelligence layer for earlier decisions and cleaner handoffs.
        </p>
      </div>
      <div className="ai-use-case-grid">
        {cases.map(([title, body], index) => (
          <article className="ai-use-case-card" key={title} style={{ "--delay": `${index * 0.12}s` }}>
            <Bot size={18} />
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function RoadmapSection() {
  const phases = [
    ["Phase 1", "Foundation", "0-30 days", "Hybrid opportunity review, CRM tagging, decision rights, billing structures, and assignment matrix."],
    ["Phase 2", "Integration", "30-90 days", "Solution review, hybrid requisition intake, Workday matrix setup, scope attribution, and finance alignment."],
    ["Phase 3", "Optimization", "3-6 months", "Employee tagging, cross-system notifications, Employee 360 attributes, THRIVE/RISE screening, and unified dashboards."],
    ["Phase 4", "AI Enablement", "6-12+ months", "Pricing intelligence, resource matching, demand forecasting, revenue controls, scope drift, and health scoring."],
  ];
  return (
    <section className="section roadmap-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Implementation roadmap</p>
          <h2>Build the operating model in practical, sequenced phases.</h2>
        </div>
      </div>
      <div className="roadmap-track">
        {phases.map(([phase, title, timing, body]) => (
          <article className="roadmap-card" key={phase}>
            <span>{phase}</span>
            <h3>{title}</h3>
            <strong>{timing}</strong>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <section className="section">
        <div className="section-heading">
          <p className="eyebrow">Application delivery</p>
          <h2>Operational clarity for every hybrid portfolio decision.</h2>
        </div>
        <div className="feature-grid">
          {[
            ["Portfolio workspace", "Manage FSO studies, FSP role requirements, and hybrid signals under one leadership view."],
            ["Process-zone KPI controls", "Track maturity, health, KPI comments, assignments, and operational exceptions by zone."],
            ["AI search and actions", "Ask portfolio questions, surface citations, and convert signals into prioritized next steps."],
            ["Integration-ready architecture", "Start with a seeded local prototype, then evolve toward CRM, RMS, Workday, OPF, BI, and data lake integrations."],
          ].map(([title, body]) => (
            <article className="feature" key={title}>
              <ShieldCheck size={18} />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function AIPortfolioAnimation() {
  const systemNodes = ["CRM", "Contracts", "RMS", "Workday", "Finance", "BI"];
  return (
    <div className="hero-panel ai-orbit-panel" aria-label="Animated AI portfolio management visualization">
      <div className="dashboard-window">
        <div className="window-dots"><span /><span /><span /></div>
        <div className="search-preview hero-search">
          <Search size={18} />
          <span>Ask: Which hybrid programs need leadership action this week?</span>
        </div>
        <div className="platform-map">
          <div className="platform-node fso-node">
            <strong>FSO</strong>
            <span>Study accountability</span>
            <small>Milestones, quality, scope</small>
          </div>
          <div className="platform-core">
            <Sparkles size={24} />
            <strong>AI portfolio layer</strong>
            <span>Pricing, resources, finance, risk, oversight</span>
          </div>
          <div className="platform-node fsp-node">
            <strong>FSP</strong>
            <span>Functional capacity</span>
            <small>Roles, skills, utilization</small>
          </div>
          <div className="orbit-ring ring-one" />
          <div className="orbit-ring ring-two" />
          <div className="pulse-line line-a" />
          <div className="pulse-line line-b" />
        </div>
        <div className="system-chip-grid">
          {systemNodes.map((node, index) => <span key={node} style={{ "--delay": `${index * 0.12}s` }}>{node}</span>)}
        </div>
        <div className="signal-grid dashboard-preview-grid">
          <MetricMini label="Portfolio health" value="84%" tone="good" />
          <MetricMini label="Hybrid tagging" value="96%" tone="good" />
          <MetricMini label="Scope drift" value="7" tone="watch" />
          <MetricMini label="AI actions" value="18" tone="good" />
        </div>
        <div className="agent-box animated-agent">
          <Bot size={18} />
          <span>Agent recommendation: convert 3 scope alerts into amendments and rebalance 5 hybrid roles</span>
        </div>
      </div>
    </div>
  );
}

function OpsImpactSection() {
  const impacts = [
    ["Commercial", "Faster hybrid proposal routing", "A", "Scoping & Pricing"],
    ["Delivery", "Shared supply and demand visibility", "C", "Resource Management"],
    ["People", "Internal mobility before external hiring", "D/E", "Talent & People"],
    ["Governance", "Program health in one operating view", "G", "Program Oversight"],
  ];
  return (
    <section className="ops-impact-section">
      <div className="section-heading impact-heading">
        <div>
          <p className="eyebrow">Technology-enabled control</p>
          <h2>Portfolio agents connect strategy, delivery, and financial integrity.</h2>
        </div>
        <p>
          The landing experience is built around the deck's target state: flexible, scalable, technology-enabled,
          and ready for AI once core data and workflows are integrated.
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
          <Stack
            items={notifications}
            render={(item) => (
              <AlertItem
                item={item}
                onAction={() => nav.openMetricDialog({
                  processZoneId: item.process_zone_id || "",
                  metric: notificationToMetric(item),
                })}
              />
            )}
          />
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
      <PortfolioSignalSections
        portfolio={portfolio}
        processZones={payload.processZones}
        onAction={(item, type) => nav.openMetricDialog({
          processZoneId: processZoneIdFromSignal(payload.processZones, item.process_zone_signal),
          metric: portfolioSignalToMetric(item, type),
        })}
      />
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

function notificationToMetric(item) {
  return {
    id: item.id,
    name: item.title,
    value: item.severity,
    unit: "",
    target: "Review",
    trend: item.read_at ? "Read" : "Unread",
    description: item.message,
  };
}

function portfolioSignalToMetric(item, type) {
  const isFso = type === "FSO study";
  return {
    id: item.id,
    name: `${type}: ${isFso ? item.nct_id : item.id}`,
    value: item.status,
    unit: "",
    target: item.process_zone_signal || "Portfolio signal",
    trend: isFso ? item.phase || "Study" : `${item.fte_need} FTE`,
    description: `${item.title}. ${item.ai_recommendation}`,
  };
}

function serviceSignalToMetric(item, serviceLine) {
  return {
    id: `signal-${serviceLine}-${item.id}`,
    name: `${serviceLine} process-zone signal: ${item.id}`,
    value: `${item.count}`,
    unit: "",
    target: "Review linked work",
    trend: `${item.share}% of service line`,
    description: `${item.count} linked records are currently tied to ${item.id}.`,
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

function processZoneIdFromSignal(processZones = [], signalName = "") {
  return processZones.find((zone) => zone.name === signalName || zone.id === signalName)?.id || "";
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
                <button
                  className="metric-action action-comment"
                  onClick={() => nav.openMetricDialog({
                    processZoneId: processZoneIdFromSignal(payload.processZones, item.id),
                    metric: serviceSignalToMetric(item, summary.title),
                  })}
                  title="Comment or assign"
                >
                  <MessageSquare size={15} />
                </button>
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
            <div className={`study-row service-detail-row signal-card ${isFso ? "fso" : "fsp"}`} key={item.id}>
              <button
                className="metric-action action-comment"
                onClick={() => nav.openMetricDialog({
                  processZoneId: processZoneIdFromSignal(payload.processZones, item.process_zone_signal),
                  metric: portfolioSignalToMetric(item, isFso ? "FSO study" : "FSP requirement"),
                })}
                title="Comment or assign"
              >
                <MessageSquare size={15} />
              </button>
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
    setStatus(isStaticMode && result.email ? "Saved locally; no email was sent from this public demo." : result.email ? `Saved and queued email notification to ${email}.` : "Saved.");
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

function AlertItem({ item, onAction }) {
  return (
    <article className={`list-item severity-${item.severity?.toLowerCase()}`}>
      {onAction && (
        <button className="metric-action action-comment" onClick={onAction} title="Comment or assign">
          <MessageSquare size={15} />
        </button>
      )}
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

function wordCount(value) {
  return String(value || "").trim().split(/\s+/).filter(Boolean).length;
}

function displayName(email) {
  const name = String(email || "Contributor").split("@")[0].replace(/[._-]+/g, " ");
  return name.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function previewLines(value) {
  const text = String(value || "").trim();
  if (text.length <= 150) return text;
  return `${text.slice(0, 150).trim()}...`;
}

createRoot(document.getElementById("root")).render(<App />);
