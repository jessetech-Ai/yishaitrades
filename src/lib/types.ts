export type TradeSide = "long" | "short";
export type TradeStatus = "win" | "loss" | "breakeven";
export type TradeLifecycleStatus = "pending" | "open" | "closed" | "invalid" | "cancelled";

export interface Trade {
  id: string;
  symbol: string;
  side: TradeSide;
  qty: number;
  entry: number;
  exit: number;
  fees: number;
  openTime: string; // ISO
  closeTime: string; // ISO
  status?: TradeLifecycleStatus;
  setup: string; // playbook tag
  account: string;
  notes: string;
  tags: string[];
  rating: number; // 1-5 discipline rating
  mfe?: number; // max favorable excursion (price)
  mae?: number; // max adverse excursion (price)
  stopLoss?: number;
  takeProfit?: number;
  riskPercent?: number;
  rewardPercent?: number;
  emotion?: "calm" | "fomo" | "fear" | "greed" | "confident" | "frustrated";
  externalId?: string;     // dedup key from MT5/TV
  source?: "manual" | "mt5" | "tradingview" | "csv";
  archivedAt?: string;     // soft delete / archive marker
}

export interface Connection {
  id: string;
  type: "mt5" | "tradingview" | "metaapi";
  name: string;
  enabled: boolean;
  // MT5 REST bridge
  baseUrl?: string;     // e.g. http://127.0.0.1:5000
  apiKey?: string;
  // TradingView (webhook.site relay)
  webhookToken?: string; // webhook.site UUID
  // shared
  accountId: string;     // target YishaiEdge account
  lastSync?: string;     // ISO
  lastError?: string;
  importedIds?: string[]; // dedup
  symbolFilter?: string;  // optional comma-separated
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  lessons: string;
  marketContext: string;
}

export interface Playbook {
  id: string;
  name: string;
  description: string;
  rules: string[];
  marketConditions: string;
  entryCriteria: string;
  exitCriteria: string;
  riskReward: number;
  color: string;
}

export interface Account {
  id: string;
  name: string;
  startingBalance: number;
  broker: string;
  currency: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  type: "pnl" | "winrate" | "trades" | "rr" | "custom";
  deadline?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  password: string;        // hashed locally (simple obfuscation for local storage)
  displayName: string;     // shown in sidebar & journal greeting
  avatar: string;          // initials or emoji
  bio: string;
  timezone: string;
  phone: string;
  location: string;
  // Trading identity
  tradingStyle: "scalper" | "day-trader" | "swing" | "position" | "other";
  experienceLevel: "beginner" | "intermediate" | "advanced" | "professional";
  preferredMarkets: string; // e.g. "US Equities, Forex"
  riskTolerance: "conservative" | "moderate" | "aggressive";
  maxDailyLoss: number;    // $ — hard stop for the day
  maxDailyTrades: number;
  // Journal personalization
  journalGreeting: string;           // custom greeting e.g. "Let's go, champ!"
  defaultMood: 1 | 2 | 3 | 4 | 5;
  journalPrompts: string[];          // custom prompts to show in journal
  showLessonsField: boolean;
  showMarketContextField: boolean;
  // Appearance
  accentColor: string;               // personal accent color
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  currency: string;
}

export interface AppState {
  trades: Trade[];
  journal: JournalEntry[];
  playbooks: Playbook[];
  accounts: Account[];
  goals: Goal[];
  activeAccount: string;
  connections: Connection[];
  syncIntervalSec: number; // 0 = off
  profile: UserProfile;
}
