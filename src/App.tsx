import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "./lib/store";
import { Sidebar, type Page } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Modal } from "./components/Modal";
import { TradeForm } from "./components/TradeForm";
import { HelpOverlay } from "./components/HelpOverlay";
import { Dashboard } from "./pages/Dashboard";
import { Trades } from "./pages/Trades";
import { Analytics } from "./pages/Analytics";
import { Calendar } from "./pages/Calendar";
import { Journal } from "./pages/Journal";
import { Playbook } from "./pages/Playbook";
import { Goals } from "./pages/Goals";
import { Insights } from "./pages/Insights";
import { Tools } from "./pages/Tools";
import { Connections } from "./pages/Connections";
import { Settings } from "./pages/Settings";
import { AuthPage } from "./pages/AuthPage";
import { Help } from "./pages/Help";
import { exportCSV, parseCSV } from "./lib/csv";
import { generatePDF } from "./lib/pdf";
import { generateShareSummary } from "./lib/share";
import { syncConnection } from "./lib/connections";
import { getAuthSession, logout, updateCurrentAuthUser, type AuthSession } from "./lib/auth";
import { useKeyboard } from "./hooks/useKeyboard";
import { tradePnl } from "./lib/calc";
import { Copy, CheckCircle2 } from "lucide-react";

const titles: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: "Dashboard", subtitle: "Your performance at a glance" },
  trades: { title: "Trade Log", subtitle: "Every position, fully searchable" },
  analytics: { title: "Analytics", subtitle: "Discover patterns in your trading" },
  calendar: { title: "Calendar", subtitle: "Daily P&L heatmap & weekly totals" },
  journal: { title: "Journal", subtitle: "The inner game — mindset & lessons" },
  playbook: { title: "Playbook", subtitle: "Document and refine your strategies" },
  goals: { title: "Goals", subtitle: "Targets that drive improvement" },
  insights: { title: "AI Insights", subtitle: "Auto-generated patterns from your data" },
  tools: { title: "Tools", subtitle: "Position sizer · R-multiple · expectancy" },
  connections: { title: "Connections", subtitle: "Auto-sync MT5 & TradingView" },
  help: { title: "Help & Audit", subtitle: "Usage guide, shortcuts, and implementation status" },
  settings: { title: "Settings", subtitle: "Accounts, data, and backups" },
};

const App = () => {
  const s = useAppState();
  const [session, setSession] = useState<AuthSession | null>(() => getAuthSession());
  const [page, setPage] = useState<Page>("dashboard");
  const [newTradeOpen, setNewTradeOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncRunAt, setLastSyncRunAt] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; tone: "good" | "bad" } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const account = useMemo(
    () => s.state.accounts.find((a) => a.id === s.state.activeAccount) ?? s.state.accounts[0],
    [s.state.accounts, s.state.activeAccount]
  );
  const accountTrades = useMemo(
    () => s.state.trades.filter((t) => t.account === account.id && !t.archivedAt),
    [s.state.trades, account.id]
  );

  // Daily loss enforcement
  const todayPnl = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return accountTrades
      .filter((t) => t.closeTime.startsWith(today))
      .reduce((s, t) => s + tradePnl(t), 0);
  }, [accountTrades]);

  const dailyLimitHit = s.state.profile.maxDailyLoss > 0 && Math.abs(todayPnl) >= s.state.profile.maxDailyLoss && todayPnl < 0;
  const dailyLimitWarn = s.state.profile.maxDailyLoss > 0 && Math.abs(todayPnl) >= s.state.profile.maxDailyLoss * 0.8 && todayPnl < 0 && !dailyLimitHit;

  // Today's trade count
  const todayTradeCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return accountTrades.filter((t) => t.closeTime.startsWith(today)).length;
  }, [accountTrades]);
  const dailyTradesLimitHit = s.state.profile.maxDailyTrades > 0 && todayTradeCount >= s.state.profile.maxDailyTrades;

  const showToast = (msg: string, tone: "good" | "bad" = "good") => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const onAuthenticated = (nextSession: AuthSession, password?: string) => {
    setSession(nextSession);
    const [firstNameFallback] = nextSession.displayName.split(" ");
    s.updateProfile({
      email: nextSession.email,
      password: password ?? s.state.profile.password,
      displayName: nextSession.displayName,
      firstName: s.state.profile.firstName || firstNameFallback || "",
    });
  };

  const onLogout = () => {
    logout();
    setSession(null);
    setPage("dashboard");
  };

  const onAuthUpdate = (patch: { email?: string; password?: string; displayName?: string }) => {
    try {
      const nextSession = updateCurrentAuthUser(patch);
      if (nextSession) setSession(nextSession);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not update account credentials", "bad");
    }
  };

  // ---- Auto-sync logic --------------------------------------------------
  const syncAll = useCallback(async (onlyId?: string) => {
    const targets = s.state.connections.filter((c) => c.enabled && (!onlyId || c.id === onlyId));
    if (!targets.length) return;
    setSyncing(true);
    let totalImported = 0;
    let totalErrors = 0;
    for (const c of targets) {
      try {
        const newTrades = await syncConnection(c);
        if (newTrades.length) {
          s.importTrades(newTrades);
          totalImported += newTrades.length;
          const newIds = newTrades.map((t) => t.externalId!).filter(Boolean);
          s.updateConnection(c.id, {
            importedIds: [...(c.importedIds || []), ...newIds],
            lastSync: new Date().toISOString(),
            lastError: undefined,
          });
        } else {
          s.updateConnection(c.id, { lastSync: new Date().toISOString(), lastError: undefined });
        }
      } catch (err) {
        totalErrors++;
        s.updateConnection(c.id, {
          lastSync: new Date().toISOString(),
          lastError: err instanceof Error ? err.message : String(err),
        });
      }
    }
    setLastSyncRunAt(new Date().toISOString());
    setSyncing(false);
    if (totalImported > 0) showToast(`Synced ${totalImported} new trade${totalImported === 1 ? "" : "s"}`, "good");
    else if (totalErrors > 0 && onlyId) showToast(`Sync failed — check connection details`, "bad");
    else if (onlyId) showToast(`No new trades to import`, "good");
  }, [s]);

  useEffect(() => {
    if (!s.state.syncIntervalSec) return;
    const id = setInterval(() => { syncAll().catch(() => {}); }, s.state.syncIntervalSec * 1000);
    return () => clearInterval(id);
  }, [s.state.syncIntervalSec, syncAll]);

  useEffect(() => {
    if (s.state.connections.some((c) => c.enabled)) syncAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Keyboard shortcuts ------------------------------------------------
  useKeyboard({
    onNewTrade: () => {
      if (dailyLimitHit) { showToast("Daily loss limit reached — no new trades today.", "bad"); return; }
      if (dailyTradesLimitHit) { showToast(`Max ${s.state.profile.maxDailyTrades} trades/day reached.`, "bad"); return; }
      setNewTradeOpen(true);
    },
    onSearch: () => setPage("trades"),
    onExport: () => exportCSV(accountTrades),
    onHelp: () => setHelpOpen((o) => !o),
    onEscape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (newTradeOpen) setNewTradeOpen(false);
      else if (shareOpen) setShareOpen(false);
      else if (sidebarOpen) setSidebarOpen(false);
    },
    onNavigate: (p) => { setPage(p as Page); setSidebarOpen(false); },
  });

  const onImport = () => fileRef.current?.click();
  const handleFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      const ts = parseCSV(r.result as string, account.id);
      if (ts.length) { s.importTrades(ts); showToast(`Imported ${ts.length} trades from CSV`); }
      else showToast(`No valid trades found in CSV`, "bad");
    };
    r.readAsText(f);
  };

  const onExport = () => exportCSV(accountTrades);
  const onExportPDF = () => {
    generatePDF(accountTrades, account, s.state.profile);
    showToast("PDF report downloaded");
  };

  const onShare = () => setShareOpen(true);
  const shareSummary = useMemo(
    () => generateShareSummary(accountTrades, account, s.state.profile),
    [accountTrades, account, s.state.profile]
  );

  const handleNewTrade = () => {
    if (dailyLimitHit) {
      showToast("🛑 Daily loss limit reached — step away, protect your capital.", "bad");
      return;
    }
    if (dailyTradesLimitHit) {
      showToast(`⚠️ You've hit your ${s.state.profile.maxDailyTrades}-trade daily max.`, "bad");
      return;
    }
    setNewTradeOpen(true);
  };

  const meta = titles[page];
  const enabledConns = s.state.connections.filter((c) => c.enabled).length;

  if (!session) {
    return <AuthPage onAuthenticated={onAuthenticated} />;
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — hidden on mobile by default */}
      <div className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <Sidebar
          page={page}
          setPage={(p) => { setPage(p); setSidebarOpen(false); }}
          profile={s.state.profile}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onNewTrade={handleNewTrade}
          onImport={onImport}
          onExport={onExport}
          onExportPDF={onExportPDF}
          onShare={onShare}
          onReset={() => { if (confirm("Reset to sample demo data?")) s.resetAll(); }}
          accounts={s.state.accounts}
          activeAccount={s.state.activeAccount}
          setActiveAccount={s.setActiveAccount}
          syncing={syncing}
          enabledConnections={enabledConns}
          onSyncClick={() => setPage("connections")}
          onMenuClick={() => setSidebarOpen(true)}
          dailyLimitHit={dailyLimitHit}
          dailyLimitWarn={dailyLimitWarn}
          todayPnl={todayPnl}
          todayTradeCount={todayTradeCount}
          maxDailyTrades={s.state.profile.maxDailyTrades}
        />
        <main className="flex-1 px-4 md:px-6 py-4 md:py-6 fade-in">
          {page === "dashboard" && <Dashboard trades={accountTrades} account={account} profile={s.state.profile} />}
          {page === "trades" && (
            <Trades
              trades={accountTrades}
              playbooks={s.state.playbooks}
              account={account}
              updateTrade={s.updateTrade}
              deleteTrade={s.deleteTrade}
            />
          )}
          {page === "analytics" && <Analytics trades={accountTrades} account={account} />}
          {page === "calendar" && <Calendar trades={accountTrades} account={account} />}
          {page === "journal" && (
            <Journal
              entries={s.state.journal}
              addJournal={s.addJournal}
              updateJournal={s.updateJournal}
              deleteJournal={s.deleteJournal}
              profile={s.state.profile}
            />
          )}
          {page === "playbook" && (
            <Playbook
              playbooks={s.state.playbooks}
              trades={accountTrades}
              addPlaybook={s.addPlaybook}
              updatePlaybook={s.updatePlaybook}
              deletePlaybook={s.deletePlaybook}
            />
          )}
          {page === "goals" && (
            <Goals
              goals={s.state.goals}
              trades={accountTrades}
              addGoal={s.addGoal}
              updateGoal={s.updateGoal}
              deleteGoal={s.deleteGoal}
            />
          )}
          {page === "insights" && <Insights trades={accountTrades} account={account} />}
          {page === "tools" && <Tools />}
          {page === "connections" && (
            <Connections
              connections={s.state.connections}
              accounts={s.state.accounts}
              syncIntervalSec={s.state.syncIntervalSec}
              lastSyncRunAt={lastSyncRunAt}
              syncing={syncing}
              addConnection={s.addConnection}
              updateConnection={s.updateConnection}
              deleteConnection={s.deleteConnection}
              setSyncInterval={s.setSyncInterval}
              syncAll={syncAll}
              addTrade={s.addTrade}
            />
          )}
          {page === "help" && <Help />}
          {page === "settings" && (
            <Settings
              state={s.state}
              setState={s.setState}
              addAccount={s.addAccount}
              clearAll={s.clearAll}
              resetAll={s.resetAll}
              updateProfile={s.updateProfile}
              onAuthUpdate={onAuthUpdate}
              onLogout={onLogout}
            />
          )}
        </main>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />

      {/* New Trade Modal — with limit warnings */}
      <Modal open={newTradeOpen} onClose={() => setNewTradeOpen(false)} title="Log New Trade" maxWidth="max-w-3xl">
        {dailyLimitWarn && (
          <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-amber-200 text-sm">
            ⚠️ You're at {Math.round((Math.abs(todayPnl) / s.state.profile.maxDailyLoss) * 100)}% of your daily loss limit. Trade carefully.
          </div>
        )}
        <TradeForm
          playbooks={s.state.playbooks}
          accountId={account.id}
          onCancel={() => setNewTradeOpen(false)}
          onSubmit={(t) => { s.addTrade(t); setNewTradeOpen(false); showToast("Trade logged ✓"); }}
        />
      </Modal>

      {/* Share Summary Modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share Performance Summary" maxWidth="max-w-xl">
        <p className="text-sm text-[#8b94a8] mb-3">Copy this text summary and share with a mentor, accountability partner, or community.</p>
        <pre className="bg-[#0a0f1c] border border-[#1f2a3d] rounded-lg p-4 text-xs text-[#cbd1de] whitespace-pre-wrap overflow-x-auto max-h-72">
          {shareSummary}
        </pre>
        <div className="flex gap-2 mt-3">
          <button
            className="btn btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(shareSummary);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
          <button className="btn btn-ghost" onClick={() => setShareOpen(false)}>Close</button>
        </div>
      </Modal>

      {/* Help overlay */}
      <HelpOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Daily limit HARD STOP banner */}
      {dailyLimitHit && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-rose-600 text-white text-center py-2 text-sm font-semibold shadow-lg">
          🛑 DAILY LOSS LIMIT REACHED — Step away. Protect your capital. No more trades today.
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 fade-in px-4 py-3 rounded-xl border shadow-2xl ${
          toast.tone === "good"
            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-100"
            : "bg-rose-500/15 border-rose-500/40 text-rose-100"
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
};

export default App;
