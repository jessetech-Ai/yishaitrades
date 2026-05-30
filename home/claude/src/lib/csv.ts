import type { Trade } from "./types";
import { tradePnl } from "./calc";
import { uid } from "./store";

export const exportCSV = (trades: Trade[]) => {
  const headers = [
    "id","symbol","side","qty","entry","exit","fees","openTime","closeTime",
    "status","setup","account","tags","rating","notes","stopLoss","takeProfit","riskPercent","rewardPercent","emotion","pnl",
  ];
  const rows = trades.map((t) => [
    t.id, t.symbol, t.side, t.qty, t.entry, t.exit, t.fees,
    t.openTime, t.closeTime, t.status ?? "closed", t.setup, t.account,
    t.tags.join("|"), t.rating, t.notes.replace(/"/g, '""'),
    t.stopLoss ?? "", t.takeProfit ?? "", t.riskPercent ?? "", t.rewardPercent ?? "", t.emotion ?? "", tradePnl(t).toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `yishaiedge-trades-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
};

export const parseCSV = (text: string, accountId: string): Trade[] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
  const trades: Trade[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => (row[h] = cells[j] ?? ""));

    try {
      const t: Trade = {
        id: row.id || uid(),
        symbol: (row.symbol || "").toUpperCase(),
        side: (row.side === "short" ? "short" : "long") as Trade["side"],
        qty: +row.qty || 0,
        entry: +row.entry || 0,
        exit: +row.exit || 0,
        fees: +row.fees || 0,
        openTime: row.opentime || new Date().toISOString(),
        closeTime: row.closetime || new Date().toISOString(),
        status: (["pending", "open", "closed", "invalid", "cancelled"].includes(row.status) ? row.status : "closed") as Trade["status"],
        setup: row.setup || "",
        account: accountId,
        notes: row.notes || "",
        tags: row.tags ? row.tags.split("|").filter(Boolean) : [],
        rating: Math.max(1, Math.min(5, +row.rating || 3)),
        stopLoss: row.stoploss ? +row.stoploss : undefined,
        takeProfit: row.takeprofit ? +row.takeprofit : undefined,
        riskPercent: row.riskpercent ? +row.riskpercent : undefined,
        rewardPercent: row.rewardpercent ? +row.rewardpercent : undefined,
        emotion: (row.emotion || "calm") as Trade["emotion"],
        source: "csv",
      };
      if (t.symbol && t.qty && t.entry && t.exit) trades.push(t);
    } catch { /* skip */ }
  }
  return trades;
};

const parseLine = (line: string): string[] => {
  const cells: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === "," && !inQ) {
      cells.push(cur); cur = "";
    } else cur += c;
  }
  cells.push(cur);
  return cells;
};
