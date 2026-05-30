import { BookOpen, CheckCircle2, Circle, HelpCircle, Keyboard, Shield, TrendingUp } from "lucide-react";

const sections = [
  {
    title: "Getting Started",
    items: [
      "Create an account or use Google demo sign-in.",
      "Set account size, daily loss limit, trading style, and currency in Settings.",
      "Press Ctrl+N or click New Trade to log your first trade.",
      "Review Dashboard, Analytics, Calendar, and Journal after each session.",
    ],
  },
  {
    title: "Daily Workflow",
    items: [
      "Log every trade immediately after closing while context is fresh.",
      "Record the setup, emotion, discipline rating, and notes honestly.",
      "Use status values: Pending, Open, Closed, Invalid, Cancelled.",
      "Respect the daily loss and max trade limits configured in Settings.",
    ],
  },
  {
    title: "Weekly Review",
    items: [
      "Filter the Trade Log to the last 7 days.",
      "Review biggest wins, biggest losses, and low-discipline trades.",
      "Compare playbooks in Analytics and Playbook pages.",
      "Export PDF or copy Share Summary for mentor review.",
    ],
  },
];

const shortcuts = [
  ["Ctrl+N", "New trade"],
  ["Ctrl+F", "Open Trade Log/search"],
  ["Ctrl+E", "Export CSV"],
  ["?", "Shortcut help"],
  ["Esc", "Close modal"],
  ["1-9", "Quick navigation"],
];

const audit = [
  [true, "Authentication gate"],
  [true, "Trade logging with validation"],
  [true, "Trade lifecycle status tracking"],
  [true, "Soft archive instead of hard delete"],
  [true, "Win rate, profit factor, expectancy, drawdown"],
  [true, "Date/symbol/strategy/status/result filters"],
  [true, "Search notes, tags, and symbols"],
  [true, "CSV import/export"],
  [true, "PDF performance reports"],
  [true, "MT5 and TradingView connection screen"],
  [true, "Journal, emotions, and psychology tracking"],
  [true, "Mobile responsive shell"],
  [false, "Production cloud database"],
  [false, "Real OAuth provider credentials"],
  [false, "Encrypted server-side storage"],
];

const metricText = [
  ["Win Rate", "Wins divided by total closed trades. Shows entry quality and strategy fit."],
  ["Profit Factor", "Gross profit divided by gross loss. Above 1.5 is healthy; above 2.0 is strong."],
  ["Drawdown", "Peak-to-trough decline in equity. Keep this low to protect mental capital."],
  ["Expectancy", "Average profit or loss per trade. The clearest simple edge score."],
];

export const Help = () => {
  const complete = audit.filter(([done]) => done).length;
  return (
    <div className="space-y-4 max-w-5xl">
      <div className="card p-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-500/30">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center"><HelpCircle size={20} /></div>
          <div>
            <h2 className="text-xl font-semibold">YishaiEdge Help & Audit</h2>
            <p className="text-sm text-[#a3acc0] mt-1">A practical guide for using the journal and a transparent status checklist for what is complete.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <div key={s.title} className="card p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><BookOpen size={15} className="text-indigo-300" /> {s.title}</h3>
            <ul className="space-y-2 text-sm text-[#cbd1de]">
              {s.items.map((item) => <li key={item} className="flex gap-2"><span className="text-indigo-300">•</span><span>{item}</span></li>)}
            </ul>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Keyboard size={15} className="text-emerald-300" /> Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {shortcuts.map(([keys, action]) => (
              <div key={keys} className="flex items-center justify-between text-sm">
                <span className="text-[#cbd1de]">{action}</span>
                <kbd className="px-2 py-1 rounded-md bg-white/5 border border-[#1f2a3d] text-xs text-[#a3acc0] font-mono">{keys}</kbd>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp size={15} className="text-violet-300" /> Metrics Explained</h3>
          <div className="space-y-2">
            {metricText.map(([name, desc]) => (
              <div key={name} className="text-sm">
                <div className="font-medium">{name}</div>
                <div className="text-[#8b94a8]">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2"><Shield size={15} className="text-amber-300" /> Product Audit Status</h3>
          <span className="chip bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">{complete}/{audit.length} complete</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {audit.map(([done, label]) => (
            <div key={String(label)} className="flex items-center gap-2 text-sm rounded-lg border border-[#1f2a3d] bg-white/[0.02] px-3 py-2">
              {done ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Circle size={15} className="text-amber-400" />}
              <span className={done ? "text-[#cbd1de]" : "text-amber-200"}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#8b94a8] mt-3">Production-only items require a real backend deployment. See docs/postgres-schema.sql, docs/api-spec.md, and docs/deployment.md.</p>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-2">Best Practices</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-emerald-300 font-medium mb-1">Do</div>
            <p className="text-[#cbd1de]">Log every trade, write the reason, track emotion, review weekly, and compare strategy performance objectively.</p>
          </div>
          <div>
            <div className="text-rose-300 font-medium mb-1">Don't</div>
            <p className="text-[#cbd1de]">Skip losers, rename strategies vaguely, edit old trades dishonestly, or ignore repeated loss patterns.</p>
          </div>
        </div>
      </div>
    </div>
  );
};