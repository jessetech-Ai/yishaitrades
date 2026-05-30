import { useMemo } from "react";
import type { Trade, Account } from "../lib/types";
import { tradePnl, computeStats, fmtCurrency, fmtPct, groupBy, sum } from "../lib/calc";
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Brain, Clock, Calendar as CalIcon } from "lucide-react";

type Insight = {
  icon: React.ComponentType<{ size?: number }>;
  tone: "good" | "bad" | "neutral" | "warn";
  title: string;
  detail: string;
};

const tonecls = {
  good: "border-emerald-500/30 bg-emerald-500/5",
  bad: "border-rose-500/30 bg-rose-500/5",
  neutral: "border-indigo-500/30 bg-indigo-500/5",
  warn: "border-amber-500/30 bg-amber-500/5",
};

const iconColor = {
  good: "text-emerald-400",
  bad: "text-rose-400",
  neutral: "text-indigo-400",
  warn: "text-amber-400",
};

export const Insights = ({ trades, account }: { trades: Trade[]; account: Account }) => {
  const insights = useMemo<Insight[]>(() => {
    if (trades.length < 5) {
      return [{
        icon: Sparkles, tone: "neutral",
        title: "Need more data",
        detail: "Log at least 5 trades to unlock personalized insights.",
      }];
    }
    const out: Insight[] = [];
    const stats = computeStats(trades);

    // Best/worst symbol
    const bySymbol = Object.entries(groupBy(trades, (t) => t.symbol))
      .map(([k, ts]) => ({ k, pnl: sum(ts.map(tradePnl)), n: ts.length }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => b.pnl - a.pnl);
    if (bySymbol.length) {
      const best = bySymbol[0], worst = bySymbol[bySymbol.length - 1];
      if (best.pnl > 0) out.push({
        icon: TrendingUp, tone: "good",
        title: `${best.k} is your most profitable instrument`,
        detail: `${fmtCurrency(best.pnl, account.currency)} across ${best.n} trades. Consider sizing up here.`,
      });
      if (worst.pnl < 0) out.push({
        icon: TrendingDown, tone: "bad",
        title: `${worst.k} is bleeding your account`,
        detail: `${fmtCurrency(worst.pnl, account.currency)} across ${worst.n} trades. Consider removing it from your watchlist or reviewing your thesis.`,
      });
    }

    // Best/worst setup
    const bySetup = Object.entries(groupBy(trades, (t) => t.setup || "Untagged"))
      .map(([k, ts]) => ({ k, pnl: sum(ts.map(tradePnl)), n: ts.length, wr: ts.filter(t => tradePnl(t) > 0).length / ts.length * 100 }))
      .filter((x) => x.n >= 2)
      .sort((a, b) => b.pnl - a.pnl);
    if (bySetup.length) {
      const best = bySetup[0];
      if (best.pnl > 0) out.push({
        icon: Sparkles, tone: "good",
        title: `"${best.k}" is your A+ playbook`,
        detail: `${fmtPct(best.wr)} win rate, ${fmtCurrency(best.pnl, account.currency)}. This is where your edge lives.`,
      });
      const losing = bySetup.filter((s) => s.pnl < 0);
      losing.forEach((l) => out.push({
        icon: AlertTriangle, tone: "warn",
        title: `"${l.k}" is underperforming`,
        detail: `${fmtPct(l.wr)} win rate · ${fmtCurrency(l.pnl, account.currency)}. Review or temporarily pause this setup.`,
      }));
    }

    // Day of week
    const dows = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const byDow = Object.entries(groupBy(trades, (t) => dows[new Date(t.closeTime).getDay()]))
      .map(([k, ts]) => ({ k, pnl: sum(ts.map(tradePnl)), n: ts.length }))
      .sort((a, b) => b.pnl - a.pnl);
    if (byDow.length > 1) {
      const best = byDow[0], worst = byDow[byDow.length - 1];
      if (best.pnl > 0) out.push({
        icon: CalIcon, tone: "good",
        title: `${best.k} is your strongest day`,
        detail: `${fmtCurrency(best.pnl, account.currency)} across ${best.n} trades. Show up prepared.`,
      });
      if (worst.pnl < 0 && worst.k !== best.k) out.push({
        icon: AlertTriangle, tone: "warn",
        title: `${worst.k} is your weakest day`,
        detail: `${fmtCurrency(worst.pnl, account.currency)} across ${worst.n} trades. Consider sitting it out or reducing size.`,
      });
    }

    // Hour analysis
    const byHour = Object.entries(groupBy(trades, (t) => new Date(t.openTime).getHours().toString()))
      .map(([k, ts]) => ({ k: +k, pnl: sum(ts.map(tradePnl)), n: ts.length }))
      .sort((a, b) => b.pnl - a.pnl);
    if (byHour.length) {
      const best = byHour[0];
      if (best.pnl > 0 && best.n >= 2) out.push({
        icon: Clock, tone: "good",
        title: `Your best hour is ${best.k}:00`,
        detail: `${fmtCurrency(best.pnl, account.currency)} earned in this hour across ${best.n} trades.`,
      });
    }

    // Discipline
    const lowRating = trades.filter((t) => t.rating <= 2);
    const highRating = trades.filter((t) => t.rating >= 4);
    const lowAvg = lowRating.length ? sum(lowRating.map(tradePnl)) / lowRating.length : 0;
    const highAvg = highRating.length ? sum(highRating.map(tradePnl)) / highRating.length : 0;
    if (lowRating.length >= 2 && highRating.length >= 2 && highAvg > lowAvg) {
      out.push({
        icon: Brain, tone: "neutral",
        title: "Discipline matters",
        detail: `Your high-discipline trades (4-5★) avg ${fmtCurrency(highAvg, account.currency)} vs ${fmtCurrency(lowAvg, account.currency)} for low-discipline. Follow the plan.`,
      });
    }

    // Emotion
    const byEmo = Object.entries(groupBy(trades, (t) => t.emotion || "—"))
      .map(([k, ts]) => ({ k, avg: sum(ts.map(tradePnl)) / ts.length, n: ts.length }))
      .filter((x) => x.n >= 2);
    const worstEmo = [...byEmo].sort((a, b) => a.avg - b.avg)[0];
    if (worstEmo && worstEmo.avg < 0) {
      out.push({
        icon: AlertTriangle, tone: "bad",
        title: `Trades made when feeling "${worstEmo.k}" lose ${fmtCurrency(Math.abs(worstEmo.avg), account.currency)} on average`,
        detail: `Notice when you feel ${worstEmo.k} — step away from the screen.`,
      });
    }

    // Hold time
    const winTrades = trades.filter((t) => tradePnl(t) > 0);
    const lossTrades = trades.filter((t) => tradePnl(t) < 0);
    const avgWinHold = winTrades.length ? sum(winTrades.map((t) => (new Date(t.closeTime).getTime() - new Date(t.openTime).getTime()) / 60000)) / winTrades.length : 0;
    const avgLossHold = lossTrades.length ? sum(lossTrades.map((t) => (new Date(t.closeTime).getTime() - new Date(t.openTime).getTime()) / 60000)) / lossTrades.length : 0;
    if (avgLossHold > avgWinHold * 1.4 && lossTrades.length >= 3) {
      out.push({
        icon: Clock, tone: "warn",
        title: "You hold losers longer than winners",
        detail: `Avg loss held ${Math.round(avgLossHold)}m vs ${Math.round(avgWinHold)}m for winners. Cut losers faster.`,
      });
    } else if (avgWinHold > avgLossHold && winTrades.length >= 3) {
      out.push({
        icon: TrendingUp, tone: "good",
        title: "You let winners run",
        detail: `Avg winner held ${Math.round(avgWinHold)}m vs ${Math.round(avgLossHold)}m for losers. Classic edge behavior.`,
      });
    }

    // Profit factor verdict
    if (stats.profitFactor >= 2) out.push({
      icon: Sparkles, tone: "good",
      title: `Profit factor of ${stats.profitFactor.toFixed(2)} — elite`,
      detail: "Above 2.0 is excellent. Stay consistent and scale gradually.",
    });
    else if (stats.profitFactor < 1) out.push({
      icon: AlertTriangle, tone: "bad",
      title: `Profit factor of ${stats.profitFactor.toFixed(2)} — unprofitable`,
      detail: "Losses exceed gains. Review your losing trades and tighten risk management.",
    });

    // Avg win vs avg loss
    if (stats.avgWin > 0 && stats.avgLoss > 0) {
      const ratio = stats.avgWin / stats.avgLoss;
      if (ratio < 1) out.push({
        icon: AlertTriangle, tone: "warn",
        title: "Your avg loss exceeds avg win",
        detail: `Avg win ${fmtCurrency(stats.avgWin)} vs avg loss ${fmtCurrency(stats.avgLoss)}. Aim for at least 1.5:1.`,
      });
    }

    return out;
  }, [trades, account]);

  return (
    <div className="space-y-4">
      <div className="card p-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-500/30">
        <div className="flex items-center gap-2 text-indigo-300 mb-1">
          <Sparkles size={16} />
          <span className="uppercase text-xs tracking-widest font-semibold">AI-Powered Insights</span>
        </div>
        <h2 className="text-xl font-semibold">Your edge, decoded</h2>
        <p className="text-sm text-[#a3acc0] mt-1">Auto-generated patterns and recommendations based on your trading history. Updated every time you log a trade.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins, i) => {
          const Icon = ins.icon;
          return (
            <div key={i} className={`rounded-xl border p-4 ${tonecls[ins.tone]}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 ${iconColor[ins.tone]}`}>
                  <Icon size={16} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{ins.title}</div>
                  <div className="text-sm text-[#cbd1de] mt-1">{ins.detail}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
