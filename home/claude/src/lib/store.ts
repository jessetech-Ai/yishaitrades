import { useEffect, useState } from "react";
import type { AppState, Trade, JournalEntry, Playbook, Account, Goal, Connection, UserProfile } from "./types";

const STORAGE_KEY = "yishaiedge_state_v1";

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const seedAccount: Account = {
  id: "acc-main",
  name: "Main Account",
  startingBalance: 25000,
  broker: "Interactive Brokers",
  currency: "USD",
};

const seedPlaybooks: Playbook[] = [
  {
    id: "pb-1",
    name: "ORB Breakout",
    description: "Opening range breakout on high relative volume stocks.",
    rules: ["Above VWAP", "RVOL > 2", "Clean range 5 min", "Stop below ORB low"],
    marketConditions: "Trending market, gap up",
    entryCriteria: "Break of 5-min opening range high with volume confirmation.",
    exitCriteria: "Trail stop under prior candle. Exit on reversal candle or 2R.",
    riskReward: 2.5,
    color: "#6366f1",
  },
  {
    id: "pb-2",
    name: "VWAP Reclaim",
    description: "Long after price reclaims VWAP from below on bullish thesis.",
    rules: ["Daily uptrend", "Volume spike on reclaim", "Stop under reclaim wick"],
    marketConditions: "Trend day or bullish reversal",
    entryCriteria: "Strong reclaim candle close above VWAP with volume.",
    exitCriteria: "Take profit at next resistance / HOD, trail stop.",
    riskReward: 2,
    color: "#10b981",
  },
  {
    id: "pb-3",
    name: "Failed Breakdown",
    description: "Trap short sellers when price reclaims a key support level.",
    rules: ["Clear flush below support", "Reclaim with volume", "Tight stop"],
    marketConditions: "Range-bound or oversold",
    entryCriteria: "Reclaim candle confirms with follow-through.",
    exitCriteria: "Top of prior range or 3R.",
    riskReward: 3,
    color: "#f59e0b",
  },
];

const seedGoals: Goal[] = [
  { id: "g1", title: "Monthly P&L Target", target: 5000, current: 0, type: "pnl" },
  { id: "g2", title: "Win Rate", target: 55, current: 0, type: "winrate" },
  { id: "g3", title: "Avg R Multiple", target: 1.5, current: 0, type: "rr" },
];

const makeSeedTrades = (): Trade[] => {
  const symbols = ["AAPL", "TSLA", "NVDA", "SPY", "MSFT", "AMD", "META", "AMZN"];
  const setups = ["ORB Breakout", "VWAP Reclaim", "Failed Breakdown"];
  const emotions: Trade["emotion"][] = ["calm", "confident", "fomo", "fear", "greed", "frustrated"];
  const trades: Trade[] = [];
  const now = new Date();
  for (let i = 0; i < 42; i++) {
    const day = new Date(now);
    day.setDate(now.getDate() - Math.floor(Math.random() * 30));
    day.setHours(9 + Math.floor(Math.random() * 6), Math.floor(Math.random() * 60), 0, 0);
    const close = new Date(day.getTime() + (5 + Math.random() * 120) * 60000);
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const side: Trade["side"] = Math.random() > 0.4 ? "long" : "short";
    const entry = 50 + Math.random() * 400;
    const winProb = 0.58;
    const isWin = Math.random() < winProb;
    const moveAbs = entry * (0.002 + Math.random() * 0.02);
    const exit = side === "long"
      ? (isWin ? entry + moveAbs : entry - moveAbs * 0.6)
      : (isWin ? entry - moveAbs : entry + moveAbs * 0.6);
    const qty = Math.floor(20 + Math.random() * 200);
    const stop = side === "long" ? entry - moveAbs * 0.5 : entry + moveAbs * 0.5;
    trades.push({
      id: uid(),
      symbol,
      side,
      qty,
      entry: +entry.toFixed(2),
      exit: +exit.toFixed(2),
      fees: +(qty * 0.005 + 1).toFixed(2),
      openTime: day.toISOString(),
      closeTime: close.toISOString(),
      status: "closed",
      setup: setups[Math.floor(Math.random() * setups.length)],
      account: "acc-main",
      notes: isWin ? "Followed plan, clean entry." : "Entered late, broke rule on stop placement.",
      tags: isWin ? ["A+ setup"] : ["chase", "late entry"].slice(0, 1 + Math.floor(Math.random() * 2)),
      rating: isWin ? 4 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 3),
      stopLoss: +stop.toFixed(2),
      takeProfit: +(side === "long" ? entry + moveAbs * 2 : entry - moveAbs * 2).toFixed(2),
      emotion: emotions[Math.floor(Math.random() * emotions.length)],
    });
  }
  return trades;
};

const seedJournal = (): JournalEntry[] => {
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  return [
    {
      id: uid(),
      date: today.toISOString().slice(0, 10),
      title: "Disciplined session",
      content: "Stuck to my A+ setups today. Avoided revenge trading after the first loss. Mental capital intact.",
      mood: 5,
      lessons: "Patience pays. Wait for confirmation, don't anticipate.",
      marketContext: "SPY trending up, low volatility, tech leading.",
    },
    {
      id: uid(),
      date: yesterday.toISOString().slice(0, 10),
      title: "Overtraded mid-day",
      content: "Took 3 trades during chop. Need a hard rule: max 1 trade per hour in low-vol conditions.",
      mood: 2,
      lessons: "Sit out chop. Less is more.",
      marketContext: "Range-bound, FOMC pending.",
    },
  ];
};

const defaultProfile: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  displayName: "Trader",
  avatar: "⚡",
  bio: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  phone: "",
  location: "",
  tradingStyle: "day-trader",
  experienceLevel: "intermediate",
  preferredMarkets: "US Equities",
  riskTolerance: "moderate",
  maxDailyLoss: 500,
  maxDailyTrades: 10,
  journalGreeting: "Let's find the edge today.",
  defaultMood: 3,
  journalPrompts: [
    "What is my plan for today?",
    "What went well? What didn't?",
    "Did I follow my rules?",
    "What emotions came up during the session?",
    "One thing I'll improve tomorrow:",
  ],
  showLessonsField: true,
  showMarketContextField: true,
  accentColor: "#6366f1",
  dateFormat: "MM/DD/YYYY",
  currency: "USD",
};

const defaultState = (): AppState => ({
  trades: makeSeedTrades(),
  journal: seedJournal(),
  playbooks: seedPlaybooks,
  accounts: [seedAccount],
  goals: seedGoals,
  activeAccount: "acc-main",
  connections: [],
  syncIntervalSec: 60,
  profile: { ...defaultProfile },
});

export const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // migration: ensure connections + syncIntervalSec + profile exist
    if (!parsed.connections) parsed.connections = [];
    if (typeof parsed.syncIntervalSec !== "number") parsed.syncIntervalSec = 60;
    if (!parsed.profile) parsed.profile = { ...defaultProfile };
    else parsed.profile = { ...defaultProfile, ...parsed.profile };
    return parsed;
  } catch {
    return defaultState();
  }
};

export const saveState = (s: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
};

export const useAppState = () => {
  const [state, setState] = useState<AppState>(() => loadState());
  useEffect(() => { saveState(state); }, [state]);

  const addTrade = (t: Omit<Trade, "id">) => setState((s) => ({ ...s, trades: [{ ...t, id: uid() }, ...s.trades] }));
  const updateTrade = (id: string, patch: Partial<Trade>) =>
    setState((s) => ({ ...s, trades: s.trades.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  const deleteTrade = (id: string) =>
    setState((s) => ({ ...s, trades: s.trades.map((t) => (t.id === id ? { ...t, archivedAt: new Date().toISOString() } : t)) }));

  const addJournal = (j: Omit<JournalEntry, "id">) =>
    setState((s) => ({ ...s, journal: [{ ...j, id: uid() }, ...s.journal] }));
  const updateJournal = (id: string, patch: Partial<JournalEntry>) =>
    setState((s) => ({ ...s, journal: s.journal.map((j) => (j.id === id ? { ...j, ...patch } : j)) }));
  const deleteJournal = (id: string) =>
    setState((s) => ({ ...s, journal: s.journal.filter((j) => j.id !== id) }));

  const addPlaybook = (p: Omit<Playbook, "id">) =>
    setState((s) => ({ ...s, playbooks: [{ ...p, id: uid() }, ...s.playbooks] }));
  const updatePlaybook = (id: string, patch: Partial<Playbook>) =>
    setState((s) => ({ ...s, playbooks: s.playbooks.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const deletePlaybook = (id: string) =>
    setState((s) => ({ ...s, playbooks: s.playbooks.filter((p) => p.id !== id) }));

  const addGoal = (g: Omit<Goal, "id">) => setState((s) => ({ ...s, goals: [{ ...g, id: uid() }, ...s.goals] }));
  const updateGoal = (id: string, patch: Partial<Goal>) =>
    setState((s) => ({ ...s, goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  const deleteGoal = (id: string) => setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));

  const addAccount = (a: Omit<Account, "id">) =>
    setState((s) => ({ ...s, accounts: [...s.accounts, { ...a, id: uid() }] }));
  const setActiveAccount = (id: string) => setState((s) => ({ ...s, activeAccount: id }));

  const addConnection = (c: Omit<Connection, "id">) =>
    setState((s) => ({ ...s, connections: [...s.connections, { ...c, id: uid(), importedIds: [] }] }));
  const updateConnection = (id: string, patch: Partial<Connection>) =>
    setState((s) => ({ ...s, connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const deleteConnection = (id: string) =>
    setState((s) => ({ ...s, connections: s.connections.filter((c) => c.id !== id) }));
  const setSyncInterval = (sec: number) => setState((s) => ({ ...s, syncIntervalSec: sec }));

  const updateProfile = (patch: Partial<UserProfile>) =>
    setState((s) => ({ ...s, profile: { ...s.profile, ...patch } }));

  const resetAll = () => setState(defaultState());
  const clearAll = () => setState({ ...defaultState(), trades: [], journal: [] });
  const importTrades = (ts: Trade[]) => setState((s) => ({ ...s, trades: [...ts, ...s.trades] }));

  return {
    state, setState,
    addTrade, updateTrade, deleteTrade,
    addJournal, updateJournal, deleteJournal,
    addPlaybook, updatePlaybook, deletePlaybook,
    addGoal, updateGoal, deleteGoal,
    addAccount, setActiveAccount,
    resetAll, clearAll, importTrades,
    addConnection, updateConnection, deleteConnection, setSyncInterval,
    updateProfile,
  };
};

export { uid };
