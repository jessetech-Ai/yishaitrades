import { useMemo } from "react";
import type { Trade, Account, UserProfile } from "../lib/types";
import { computeStats, equityCurve, drawdown, fmtCurrency, fmtPct, tradePnl, tradeR, sum } from "../lib/calc";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar,
  CartesianGrid, ReferenceLine, Cell, LineChart, Line,
} from "recharts";
import {
  TrendingUp, TrendingDown, Percent, Hash, Award, AlertTriangle,
  Flame, Clock, Lightbulb, Target,
} from "lucide-react";

const KPI = ({ icon: Icon, label, value, hint, tone = "neutral" }: {
  icon: React.ComponentType<{ size?: number }>; label: string; value: string; hint?: string;
  tone?: "neutral" | "good" | "bad";
}) => {
  const toneCls = tone === "good" ? "text-emerald-400" : tone === "bad" ? "text-rose-400" : "text-white";
  return (
    <div className="card p-3 md:p-4">
      <div className="flex items-center gap-2 text-[#8b94a8] text-[10px] md:text-xs uppercase tracking-wider">
        <Icon size={13} /> {label}
      </div>
      <div className={`mt-1 md:mt-2 text-xl md:text-2xl font-semibold tracking-tight ${toneCls}`}>{value}</div>
      {hint && <div className="text-[10px] md:text-xs text-[#8b94a8] mt-0.5">{hint}</div>}
    </div>
  );
};

// Generate coaching recommendation
const getCoaching = (stats: ReturnType<typeof computeStats>, dd: { maxDDPct: number }): { icon: React.ComponentType<{ size?: number }>; title: string; detail: string; tone: string } | null => {
  if (stats.trades < 5) return null;

  // Priority order: biggest weakness first
  if (stats.profitFactor < 1 && stats.trades >= 10) return {
    icon: AlertTriangle,
    title: "Focus: You're losing money overall",
    detail: `Profit factor is ${stats.profitFactor.toFixed(2)}x (need >1.0). Review your losing trades — are stops too wide? Are you cutting winners too early?`,
    tone: "bad",
  };
  if (stats.avgLoss > stats.avgWin * 1.3 && stats.losses > 3) return {
    icon: Target,
    title: "Focus: Losses are bigger than wins",
    detail: `Avg loss (${fmtCurrency(stats.avgLoss)}) exceeds avg win (${fmtCurrency(stats.avgWin)}). Tighten stops or let winners run longer. Aim for avg win ≥ 1.5× avg loss.`,
    tone: "warn",
  };
  if (stats.winRate < 45 && stats.trades >= 10) return {
    icon: Percent,
    title: "Focus: Win rate is low",
    detail: `At ${fmtPct(stats.winRate)}, you need excellent R:R to be profitable. Either improve entry quality or increase your avg win size.`,
    tone: "warn",
  };
  if (dd.maxDDPct > 20) return {
    icon: AlertTriangle,
    title: "Focus: Drawdown is high",
    detail: `Max drawdown of ${fmtPct(dd.maxDDPct)} is risky. Consider smaller position sizes or stricter daily loss limits.`,
    tone: "bad",
  };
  if (stats.worstStreak >= 5) return {
    icon: Flame,
    title: "Watch: Long losing streaks",
    detail: `You've had ${stats.worstStreak} consecutive losses. Add a circuit breaker — stop trading after 3 losses in a row.`,
    tone: "warn",
  };
  if (stats.profitFactor >= 2) return {
    icon: TrendingUp,
    title: "You have a real edge — scale carefully",
    detail: `Profit factor of ${stats.profitFactor.toFixed(2)}x is excellent. Consider gradually increasing position size while maintaining discipline.`,
    tone: "good",
  };
  return {
    icon: Lightbulb,
    title: "Keep building data",
    detail: `With ${stats.trades} trades logged, patterns are emerging. Keep journaling every session to unlock deeper insights.`,
    tone: "neutral",
  };
};

export const Dashboard = ({ trades, account, profile }: { trades: Trade[]; account: Account; profile?: UserProfile }) => {
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = profile?.displayName || "Trader";
  const stats = useMemo(() => computeStats(trades), [trades]);
  const curve = useMemo(() => equityCurve(trades, account.startingBalance), [trades, account]);
  const dd = useMemo(() => drawdown(curve), [curve]);

  const last10 = useMemo(() => [...trades].sort((a, b) => +new Date(b.closeTime) - +new Date(a.closeTime)).slice(0, 10), [trades]);

  // Daily P&L bars (last 14 days)
  const daily = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trades) {
      const d = t.closeTime.slice(0, 10);
      map[d] = (map[d] || 0) + tradePnl(t);
    }
    const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14);
    return entries.map(([date, pnl]) => ({ date: date.slice(5), pnl }));
  }, [trades]);

  // Win rate trend (rolling 10-trade average)
  const winTrend = useMemo(() => {
    if (trades.length < 5) return [];
    const sorted = [...trades].sort((a, b) => +new Date(a.closeTime) - +new Date(b.closeTime));
    const window = Math.min(10, Math.max(3, Math.floor(sorted.length / 4)));
    const data: { i: number; wr: number }[] = [];
    for (let i = window; i <= sorted.length; i++) {
      const slice = sorted.slice(i - window, i);
      const wins = slice.filter((t) => tradePnl(t) > 0).length;
      data.push({ i, wr: (wins / window) * 100 });
    }
    return data;
  }, [trades]);

  // R:R distribution (probability chart)
  const rrDist = useMemo(() => {
    const rrs = trades.map(tradeR).filter((r): r is number => r !== null);
    if (rrs.length < 3) return [];
    const buckets = [
      { label: "< -2R", min: -Infinity, max: -2 },
      { label: "-2 to -1R", min: -2, max: -1 },
      { label: "-1 to 0R", min: -1, max: 0 },
      { label: "0 to 1R", min: 0, max: 1 },
      { label: "1 to 2R", min: 1, max: 2 },
      { label: "2 to 3R", min: 2, max: 3 },
      { label: "> 3R", min: 3, max: Infinity },
    ];
    return buckets.map((b) => ({
      label: b.label,
      count: rrs.filter((r) => r >= b.min && r < b.max).length,
      pct: rrs.length ? (rrs.filter((r) => r >= b.min && r < b.max).length / rrs.length) * 100 : 0,
    }));
  }, [trades]);

  const coaching = useMemo(() => getCoaching(stats, dd), [stats, dd]);
  const tooltipStyle = { background: "#0f1626", border: "1px solid #1f2a3d", borderRadius: 10 };

  // Today's P&L
  const todayPnl = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return sum(trades.filter((t) => t.closeTime.startsWith(today)).map(tradePnl));
  }, [trades]);

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Personalized greeting */}
      <div className="card p-4 bg-gradient-to-r from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{timeGreet}, {displayName} 👋</h2>
            <p className="text-xs text-[#a3acc0] mt-0.5">
              {stats.trades > 0
                ? `${stats.trades} trade${stats.trades > 1 ? "s" : ""} · ${fmtPct(stats.winRate)} win rate · ${fmtCurrency(stats.totalPnl, account.currency)} total P&L`
                : "No trades yet — start logging to unlock insights."
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {todayPnl !== 0 && (
              <div className={`chip border text-xs px-2 py-1 ${todayPnl >= 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
                Today: {fmtCurrency(todayPnl, account.currency)}
              </div>
            )}
            {profile?.maxDailyLoss && todayPnl < 0 && Math.abs(todayPnl) > profile.maxDailyLoss * 0.8 && (
              <div className="chip bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs px-2.5 py-1">
                ⚠️ Near daily limit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Coaching recommendation */}
      {coaching && (
        <div className={`card p-4 border ${
          coaching.tone === "bad" ? "border-rose-500/30 bg-rose-500/5" :
          coaching.tone === "warn" ? "border-amber-500/30 bg-amber-500/5" :
          coaching.tone === "good" ? "border-emerald-500/30 bg-emerald-500/5" :
          "border-indigo-500/30 bg-indigo-500/5"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              coaching.tone === "bad" ? "bg-rose-500/20 text-rose-400" :
              coaching.tone === "warn" ? "bg-amber-500/20 text-amber-400" :
              coaching.tone === "good" ? "bg-emerald-500/20 text-emerald-400" :
              "bg-indigo-500/20 text-indigo-300"
            }`}>
              <coaching.icon size={16} />
            </div>
            <div>
              <div className="font-semibold text-sm">{coaching.title}</div>
              <div className="text-sm text-[#cbd1de] mt-0.5">{coaching.detail}</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <KPI icon={TrendingUp} label="Net P&L" value={fmtCurrency(stats.totalPnl, account.currency)} tone={stats.totalPnl >= 0 ? "good" : "bad"} hint={`From ${stats.trades} trades`} />
        <KPI icon={Percent} label="Win Rate" value={fmtPct(stats.winRate)} hint={`${stats.wins}W · ${stats.losses}L · ${stats.breakeven}BE`} />
        <KPI icon={Award} label="Profit Factor" value={isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) : "∞"} tone={stats.profitFactor >= 1.5 ? "good" : stats.profitFactor >= 1 ? "neutral" : "bad"} hint="Gross win / Gross loss" />
        <KPI icon={Hash} label="Expectancy" value={fmtCurrency(stats.expectancy, account.currency)} tone={stats.expectancy > 0 ? "good" : "bad"} hint="Avg $ per trade" />
        <KPI icon={TrendingUp} label="Avg Win" value={fmtCurrency(stats.avgWin, account.currency)} tone="good" />
        <KPI icon={TrendingDown} label="Avg Loss" value={fmtCurrency(stats.avgLoss, account.currency)} tone="bad" />
        <KPI icon={Flame} label="Best Streak" value={`${stats.bestStreak}W`} tone="good" />
        <KPI icon={AlertTriangle} label="Max Drawdown" value={fmtCurrency(dd.maxDD, account.currency)} tone="bad" hint={fmtPct(dd.maxDDPct) + " from peak"} />
      </div>

      {/* Charts row 1: Equity + Daily P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Equity Curve</h3>
            <span className="text-xs text-[#8b94a8]">Start: {fmtCurrency(account.startingBalance, account.currency)}</span>
          </div>
          <div className="h-56 md:h-64">
            <ResponsiveContainer>
              <AreaChart data={curve.map((c, i) => ({ i, equity: c.equity }))}>
                <defs>
                  <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f2a3d" vertical={false} />
                <XAxis dataKey="i" hide />
                <YAxis stroke="#8b94a8" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#8b94a8" }} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
                <ReferenceLine y={account.startingBalance} stroke="#8b94a8" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="equity" stroke="#6366f1" strokeWidth={2} fill="url(#eq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Daily P&L</h3>
            <span className="text-xs text-[#8b94a8]">Last 14</span>
          </div>
          <div className="h-56 md:h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid stroke="#1f2a3d" vertical={false} />
                <XAxis dataKey="date" stroke="#8b94a8" fontSize={10} />
                <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
                <ReferenceLine y={0} stroke="#8b94a8" />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {daily.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#f43f5e"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts row 2: Win Rate Trend + R:R Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {winTrend.length > 3 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Win Rate Trend</h3>
              <span className="text-xs text-[#8b94a8]">Rolling average</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <LineChart data={winTrend}>
                  <CartesianGrid stroke="#1f2a3d" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis stroke="#8b94a8" fontSize={10} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${Number(v).toFixed(1)}%` as string} />
                  <ReferenceLine y={50} stroke="#8b94a8" strokeDasharray="3 3" label={{ value: "50%", fill: "#8b94a8", fontSize: 10 }} />
                  <Line type="monotone" dataKey="wr" stroke="#10b981" strokeWidth={2} dot={false} name="Win Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {rrDist.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">R-Multiple Distribution</h3>
              <span className="text-xs text-[#8b94a8]">How often you hit each R</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={rrDist}>
                  <CartesianGrid stroke="#1f2a3d" vertical={false} />
                  <XAxis dataKey="label" stroke="#8b94a8" fontSize={9} angle={-20} textAnchor="end" height={40} />
                  <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, p) => [`${Number(v).toFixed(1)}% (${p.payload.count} trades)`, "Frequency"]} />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {rrDist.map((d, i) => <Cell key={i} fill={d.label.includes("-") ? "#f43f5e" : d.label.includes("0 to 1") ? "#f59e0b" : "#10b981"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Trades */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Recent Trades</h3>
          <span className="text-xs text-[#8b94a8] flex items-center gap-1"><Clock size={12} /> Last 10</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] md:text-xs uppercase text-[#8b94a8]">
              <tr className="border-b border-[#1f2a3d]">
                <th className="text-left py-2 px-2">Symbol</th>
                <th className="text-left py-2 px-2">Side</th>
                <th className="text-right py-2 px-2 hidden md:table-cell">Qty</th>
                <th className="text-right py-2 px-2 hidden md:table-cell">Entry</th>
                <th className="text-right py-2 px-2 hidden md:table-cell">Exit</th>
                <th className="text-right py-2 px-2">P&L</th>
                <th className="text-left py-2 px-2 hidden md:table-cell">Setup</th>
                <th className="text-left py-2 px-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {last10.map((t) => {
                const p = tradePnl(t);
                return (
                  <tr key={t.id} className="border-b border-[#1f2a3d]/50 hover:bg-white/[0.02]">
                    <td className="py-2 px-2 font-medium">{t.symbol}</td>
                    <td className="py-2 px-2">
                      <span className={`chip ${t.side === "long" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                        {t.side.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right text-[#a3acc0] hidden md:table-cell">{t.qty}</td>
                    <td className="py-2 px-2 text-right text-[#a3acc0] hidden md:table-cell">{t.entry.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-[#a3acc0] hidden md:table-cell">{t.exit.toFixed(2)}</td>
                    <td className={`py-2 px-2 text-right font-semibold ${p >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtCurrency(p, account.currency)}</td>
                    <td className="py-2 px-2 text-[#a3acc0] hidden md:table-cell">{t.setup || "—"}</td>
                    <td className="py-2 px-2 text-[#8b94a8] text-xs">{new Date(t.closeTime).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {last10.length === 0 && (
                <tr><td colSpan={8} className="py-10 text-center text-[#8b94a8]">
                  <div className="text-2xl mb-2">📈</div>
                  No trades yet. Hit <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-[#1f2a3d] font-mono text-xs">Ctrl+N</kbd> or click "New Trade" to get started.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
