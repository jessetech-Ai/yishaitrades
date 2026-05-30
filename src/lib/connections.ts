import type { Trade, Connection } from "./types";
import { uid } from "./store";

/* ------------------------------------------------------------------ */
/* MT5 REST bridge                                                     */
/* ------------------------------------------------------------------ */
/* Works with open-source MT5 REST servers like                        */
/*   https://github.com/mikha-dev/mt5-rest                             */
/*   https://github.com/DevRico003/mt5-rest-api                        */
/* Run locally on your trading PC; expose http://127.0.0.1:5000        */
/* ------------------------------------------------------------------ */

interface MT5Deal {
  ticket?: number | string;
  order?: number | string;
  symbol: string;
  type?: number | string;   // 0=buy 1=sell  OR  "DEAL_TYPE_BUY"
  action?: string;
  volume?: number;
  price?: number;
  profit?: number;
  commission?: number;
  swap?: number;
  fee?: number;
  comment?: string;
  time?: number | string;   // unix seconds or ISO
  time_msc?: number;
}

const parseMT5Time = (t: MT5Deal["time"]): string => {
  if (!t) return new Date().toISOString();
  if (typeof t === "number") return new Date(t * (t > 1e12 ? 1 : 1000)).toISOString();
  if (/^\d+$/.test(t)) return new Date(parseInt(t, 10) * 1000).toISOString();
  return new Date(t).toISOString();
};

const mt5Side = (d: MT5Deal): Trade["side"] => {
  const v = (typeof d.type === "string" ? d.type : d.action || "").toLowerCase();
  if (v.includes("sell")) return "short";
  if (typeof d.type === "number") return d.type === 1 ? "short" : "long";
  return "long";
};

const dealToTrade = (d: MT5Deal, accountId: string, source: Trade["source"]): Trade | null => {
  const id = String(d.ticket ?? d.order ?? "");
  const profit = (d.profit ?? 0) + (d.commission ?? 0) + (d.swap ?? 0);
  // Only treat closed/profitable deals as trades — ignore balance/credit ops
  if (!d.symbol || !d.volume || (!profit && !d.price)) return null;

  // We don't have separate entry/exit from a single deal; synthesise an entry
  // price using profit math so equity curve stays exact.
  const exit = d.price ?? 0;
  const qty = d.volume ?? 0;
  const dir = mt5Side(d) === "long" ? 1 : -1;
  const entry = qty > 0 ? exit - (profit / (qty * dir)) : exit;

  const closeTime = parseMT5Time(d.time);
  // Approximate openTime — MT5 single-deal model doesn't give it; offset 1m
  const openTime = new Date(new Date(closeTime).getTime() - 60_000).toISOString();

  return {
    id: uid(),
    externalId: `mt5:${id}`,
    source,
    symbol: d.symbol.toUpperCase(),
    side: mt5Side(d),
    qty,
    entry: +entry.toFixed(5),
    exit: +exit.toFixed(5),
    fees: Math.abs((d.commission ?? 0) + (d.swap ?? 0) + (d.fee ?? 0)),
    openTime,
    closeTime,
    status: "closed",
    setup: "",
    account: accountId,
    notes: d.comment || "",
    tags: ["mt5"],
    rating: 3,
    emotion: "calm",
  };
};

export const syncMT5 = async (conn: Connection): Promise<Trade[]> => {
  if (!conn.baseUrl) throw new Error("Missing base URL");
  const base = conn.baseUrl.replace(/\/+$/, "");
  const headers: HeadersInit = conn.apiKey ? { "X-API-KEY": conn.apiKey, Authorization: `Bearer ${conn.apiKey}` } : {};

  // Try /deals first, then /history (different community implementations)
  let raw: unknown = null;
  for (const path of ["/deals", "/history"]) {
    try {
      const res = await fetch(`${base}${path}`, { headers });
      if (res.ok) { raw = await res.json(); break; }
    } catch { /* try next */ }
  }
  if (!raw) throw new Error("Could not reach MT5 REST bridge — verify URL & that the server is running");

  const arr: MT5Deal[] = Array.isArray(raw) ? raw as MT5Deal[]
    : Array.isArray((raw as { deals?: MT5Deal[] }).deals) ? (raw as { deals: MT5Deal[] }).deals
    : Array.isArray((raw as { data?: MT5Deal[] }).data) ? (raw as { data: MT5Deal[] }).data
    : [];

  const already = new Set(conn.importedIds || []);
  const out: Trade[] = [];
  for (const d of arr) {
    const t = dealToTrade(d, conn.accountId, "mt5");
    if (!t || !t.externalId) continue;
    if (already.has(t.externalId)) continue;
    if (conn.symbolFilter && !conn.symbolFilter.toUpperCase().split(",").map(s => s.trim()).includes(t.symbol)) continue;
    out.push(t);
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* TradingView via webhook.site relay                                  */
/* ------------------------------------------------------------------ */
/* User creates a webhook.site URL, puts JSON in their TradingView     */
/* alert "Message" field, sets webhook URL → webhook.site/<token>      */
/* We poll webhook.site's CORS-enabled API for the request list.       */
/* ------------------------------------------------------------------ */

interface WebhookSiteRequest {
  uuid: string;
  created_at: string;
  content: string;     // alert body (JSON string)
  ip?: string;
}

interface TVPayload {
  symbol?: string;
  ticker?: string;
  side?: "buy" | "sell" | "long" | "short";
  action?: string;
  qty?: number;
  quantity?: number;
  size?: number;
  entry?: number;
  price?: number;
  exit?: number;
  close?: number;
  stop?: number;
  sl?: number;
  target?: number;
  tp?: number;
  setup?: string;
  strategy?: string;
  notes?: string;
  time?: string;
}

const tvToTrade = (p: TVPayload, externalId: string, accountId: string): Trade | null => {
  const symbol = (p.symbol || p.ticker || "").toUpperCase();
  if (!symbol) return null;
  const sideRaw = (p.side || p.action || "buy").toLowerCase();
  const side: Trade["side"] = sideRaw.includes("sell") || sideRaw.includes("short") ? "short" : "long";
  const entry = +(p.entry ?? p.price ?? 0);
  const exit = +(p.exit ?? p.close ?? p.price ?? 0);
  const qty = +(p.qty ?? p.quantity ?? p.size ?? 1);
  const time = p.time ? new Date(p.time).toISOString() : new Date().toISOString();
  return {
    id: uid(),
    externalId: `tv:${externalId}`,
    source: "tradingview",
    symbol, side, qty,
    entry, exit,
    fees: 0,
    status: "closed",
    openTime: time,
    closeTime: time,
    setup: p.setup || p.strategy || "",
    account: accountId,
    notes: p.notes || "From TradingView alert",
    tags: ["tradingview"],
    rating: 3,
    stopLoss: p.stop ?? p.sl,
    takeProfit: p.target ?? p.tp,
    emotion: "calm",
  };
};

export const syncTradingView = async (conn: Connection): Promise<Trade[]> => {
  if (!conn.webhookToken) throw new Error("Missing webhook.site token");
  const token = conn.webhookToken.trim();
  // webhook.site CORS-enabled API
  const url = `https://webhook.site/token/${token}/requests?sorting=newest&per_page=50`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`webhook.site responded ${res.status} — check your token`);
  const json = (await res.json()) as { data?: WebhookSiteRequest[] };
  const requests = json.data || [];
  const already = new Set(conn.importedIds || []);
  const out: Trade[] = [];
  for (const r of requests) {
    if (already.has(`tv:${r.uuid}`)) continue;
    let payload: TVPayload | null = null;
    try { payload = JSON.parse(r.content) as TVPayload; }
    catch { continue; }
    const t = tvToTrade(payload, r.uuid, conn.accountId);
    if (!t) continue;
    if (conn.symbolFilter && !conn.symbolFilter.toUpperCase().split(",").map(s => s.trim()).includes(t.symbol)) continue;
    out.push(t);
  }
  return out;
};

/* ------------------------------------------------------------------ */
/* Manual paste — quick import of one TV alert JSON                    */
/* ------------------------------------------------------------------ */
export const parsePastedAlert = (text: string, accountId: string): Trade | null => {
  try {
    const p = JSON.parse(text) as TVPayload;
    return tvToTrade(p, uid(), accountId);
  } catch { return null; }
};

/* ------------------------------------------------------------------ */
/* Master sync — runs all enabled connections                          */
/* ------------------------------------------------------------------ */
export const syncConnection = async (conn: Connection): Promise<Trade[]> => {
  if (conn.type === "mt5") return syncMT5(conn);
  if (conn.type === "tradingview") return syncTradingView(conn);
  return [];
};
