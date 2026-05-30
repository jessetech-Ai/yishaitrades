import type { Trade, TradeStatus } from "./types";

export const tradePnl = (t: Trade): number => {
  const dir = t.side === "long" ? 1 : -1;
  return (t.exit - t.entry) * t.qty * dir - t.fees;
};

export const tradeR = (t: Trade): number | null => {
  if (!t.stopLoss) return null;
  const risk = Math.abs(t.entry - t.stopLoss) * t.qty;
  if (risk === 0) return null;
  return tradePnl(t) / risk;
};

export const tradeStatus = (t: Trade): TradeStatus => {
  const p = tradePnl(t);
  if (p > 0.0001) return "win";
  if (p < -0.0001) return "loss";
  return "breakeven";
};

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

export interface PerfStats {
  totalPnl: number;
  trades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  expectancy: number;
  largestWin: number;
  largestLoss: number;
  avgRR: number;
  bestStreak: number;
  worstStreak: number;
  totalFees: number;
  avgHoldMin: number;
}

export const computeStats = (trades: Trade[]): PerfStats => {
  const pnls = trades.map(tradePnl);
  const totalPnl = sum(pnls);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);
  const breakeven = pnls.filter((p) => p === 0).length;
  const sumWins = sum(wins);
  const sumLosses = Math.abs(sum(losses));
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length ? sumWins / wins.length : 0;
  const avgLoss = losses.length ? sumLosses / losses.length : 0;
  const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? Infinity : 0;
  const expectancy = trades.length ? totalPnl / trades.length : 0;
  const largestWin = wins.length ? Math.max(...wins) : 0;
  const largestLoss = losses.length ? Math.min(...losses) : 0;

  const rrs = trades.map(tradeR).filter((r): r is number => r !== null);
  const avgRR = rrs.length ? sum(rrs) / rrs.length : 0;

  // streaks
  let cur = 0, bestStreak = 0, worstStreak = 0;
  for (const p of pnls) {
    if (p > 0) {
      cur = cur > 0 ? cur + 1 : 1;
      bestStreak = Math.max(bestStreak, cur);
    } else if (p < 0) {
      cur = cur < 0 ? cur - 1 : -1;
      worstStreak = Math.min(worstStreak, cur);
    } else { cur = 0; }
  }

  const totalFees = sum(trades.map((t) => t.fees));
  const holdMins = trades.map((t) => (new Date(t.closeTime).getTime() - new Date(t.openTime).getTime()) / 60000);
  const avgHoldMin = holdMins.length ? sum(holdMins) / holdMins.length : 0;

  return {
    totalPnl, trades: trades.length, wins: wins.length, losses: losses.length, breakeven,
    winRate, avgWin, avgLoss, profitFactor, expectancy, largestWin, largestLoss, avgRR,
    bestStreak, worstStreak: Math.abs(worstStreak), totalFees, avgHoldMin,
  };
};

export const equityCurve = (trades: Trade[], starting = 0): { date: string; equity: number; pnl: number }[] => {
  const sorted = [...trades].sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
  let eq = starting;
  return sorted.map((t) => {
    const p = tradePnl(t);
    eq += p;
    return { date: t.closeTime, equity: eq, pnl: p };
  });
};

export const drawdown = (curve: { equity: number }[]): { maxDD: number; maxDDPct: number } => {
  let peak = -Infinity, maxDD = 0, peakAtMax = 0;
  for (const c of curve) {
    if (c.equity > peak) peak = c.equity;
    const dd = peak - c.equity;
    if (dd > maxDD) { maxDD = dd; peakAtMax = peak; }
  }
  return { maxDD, maxDDPct: peakAtMax > 0 ? (maxDD / peakAtMax) * 100 : 0 };
};

export const dailyPnl = (trades: Trade[]): Record<string, number> => {
  const map: Record<string, number> = {};
  for (const t of trades) {
    const d = t.closeTime.slice(0, 10);
    map[d] = (map[d] || 0) + tradePnl(t);
  }
  return map;
};

export const groupBy = <T>(arr: T[], key: (x: T) => string): Record<string, T[]> => {
  return arr.reduce<Record<string, T[]>>((acc, x) => {
    const k = key(x);
    (acc[k] ||= []).push(x);
    return acc;
  }, {});
};

export const fmtCurrency = (n: number, ccy = "USD") => {
  if (!isFinite(n)) return "∞";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: ccy, maximumFractionDigits: 2 }).format(n);
};
export const fmtPct = (n: number, d = 1) => `${n.toFixed(d)}%`;
export const fmtNum = (n: number, d = 2) => n.toFixed(d);
