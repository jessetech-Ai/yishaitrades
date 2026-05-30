import { useMemo, useState } from "react";
import type { Trade, Account } from "../lib/types";
import { dailyPnl, fmtCurrency } from "../lib/calc";
import { ChevronLeft, ChevronRight } from "lucide-react";

const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export const Calendar = ({ trades, account }: { trades: Trade[]; account: Account }) => {
  const [cursor, setCursor] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });

  const pnlMap = useMemo(() => dailyPnl(trades), [trades]);
  const tradesPerDay = useMemo(() => {
    const m: Record<string, Trade[]> = {};
    trades.forEach((t) => {
      const k = t.closeTime.slice(0, 10);
      (m[k] ||= []).push(t);
    });
    return m;
  }, [trades]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: ({ date: string; day: number } | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${(month + 1).toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    cells.push({ date: ds, day: d });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const monthPnl = Object.entries(pnlMap)
    .filter(([d]) => d.startsWith(`${year}-${(month + 1).toString().padStart(2, "0")}`))
    .reduce((s, [, v]) => s + v, 0);

  const tradingDays = Object.keys(pnlMap).filter((d) =>
    d.startsWith(`${year}-${(month + 1).toString().padStart(2, "0")}`)
  ).length;

  const winDays = Object.entries(pnlMap)
    .filter(([d, v]) => d.startsWith(`${year}-${(month + 1).toString().padStart(2, "0")}`) && v > 0).length;

  // Weekly totals
  const weeks: { weekIdx: number; pnl: number; trades: number; days: number }[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const slice = cells.slice(i, i + 7).filter(Boolean) as { date: string; day: number }[];
    const wPnl = slice.reduce((s, c) => s + (pnlMap[c.date] || 0), 0);
    const wTrades = slice.reduce((s, c) => s + (tradesPerDay[c.date]?.length || 0), 0);
    const wDays = slice.filter((c) => tradesPerDay[c.date]?.length).length;
    weeks.push({ weekIdx: i / 7 + 1, pnl: wPnl, trades: wTrades, days: wDays });
  }

  const cellColor = (pnl: number) => {
    if (pnl === 0) return "bg-white/[0.02] border-[#1f2a3d]";
    if (pnl > 0) return "border-emerald-500/40";
    return "border-rose-500/40";
  };

  const cellBg = (pnl: number) => {
    if (pnl === 0) return {};
    const max = 1500;
    const intensity = Math.min(Math.abs(pnl) / max, 1) * 0.35 + 0.08;
    return pnl > 0
      ? { background: `rgba(16, 185, 129, ${intensity})` }
      : { background: `rgba(244, 63, 94, ${intensity})` };
  };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}><ChevronLeft size={15} /></button>
            <div className="text-lg font-semibold tracking-tight">{monthNames[month]} {year}</div>
            <button className="btn btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}><ChevronRight size={15} /></button>
            <button className="btn btn-ghost text-xs" onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Today</button>
          </div>
          <div className="flex gap-4 text-sm">
            <div><span className="text-[#8b94a8] text-xs uppercase">Month P&L</span> <span className={`ml-2 font-semibold ${monthPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtCurrency(monthPnl, account.currency)}</span></div>
            <div><span className="text-[#8b94a8] text-xs uppercase">Trading Days</span> <span className="ml-2 font-semibold">{tradingDays}</span></div>
            <div><span className="text-[#8b94a8] text-xs uppercase">Win Days</span> <span className="ml-2 font-semibold text-emerald-400">{winDays}</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_140px] gap-3">
        <div className="card p-3">
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-xs text-[#8b94a8] text-center py-1 font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((c, i) => {
              if (!c) return <div key={i} className="aspect-square" />;
              const pnl = pnlMap[c.date] || 0;
              const tcount = tradesPerDay[c.date]?.length || 0;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg border p-1.5 flex flex-col text-xs ${cellColor(pnl)} ${tcount ? "cursor-pointer hover:scale-[1.02] transition-transform" : ""}`}
                  style={cellBg(pnl)}
                  title={tcount ? `${tcount} trade${tcount > 1 ? "s" : ""}: ${fmtCurrency(pnl, account.currency)}` : ""}
                >
                  <div className="text-[#a3acc0] font-medium">{c.day}</div>
                  {tcount > 0 && (
                    <div className="mt-auto">
                      <div className={`font-semibold text-[11px] ${pnl >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {pnl >= 0 ? "+" : ""}{Math.round(pnl)}
                      </div>
                      <div className="text-[10px] text-[#8b94a8]">{tcount}t</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-3">
          <div className="text-xs text-[#8b94a8] uppercase tracking-wider font-medium mb-2 text-center">Weekly</div>
          <div className="space-y-1.5">
            {weeks.map((w) => (
              <div key={w.weekIdx} className="rounded-lg border border-[#1f2a3d] p-2 text-xs" style={cellBg(w.pnl)}>
                <div className="text-[#8b94a8] text-[10px]">Week {w.weekIdx}</div>
                <div className={`font-semibold ${w.pnl >= 0 ? "text-emerald-300" : w.pnl < 0 ? "text-rose-300" : "text-[#a3acc0]"}`}>
                  {fmtCurrency(w.pnl, account.currency)}
                </div>
                <div className="text-[10px] text-[#8b94a8]">{w.days}d · {w.trades}t</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
