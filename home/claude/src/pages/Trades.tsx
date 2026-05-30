import { useMemo, useState } from "react";
import type { Trade, Playbook, Account } from "../lib/types";
import { tradePnl, tradeR, fmtCurrency } from "../lib/calc";
import { Modal } from "../components/Modal";
import { TradeForm } from "../components/TradeForm";
import { Pencil, Trash2, Search, Filter } from "lucide-react";

export const Trades = ({
  trades, playbooks, account,
  updateTrade, deleteTrade,
}: {
  trades: Trade[]; playbooks: Playbook[]; account: Account;
  updateTrade: (id: string, patch: Partial<Trade>) => void;
  deleteTrade: (id: string) => void;
}) => {
  const [search, setSearch] = useState("");
  const [filterSide, setFilterSide] = useState<string>("");
  const [filterSetup, setFilterSetup] = useState<string>("");
  const [filterResult, setFilterResult] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [editing, setEditing] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    return trades
      .filter((t) => !search || t.symbol.toLowerCase().includes(search.toLowerCase()) || t.notes.toLowerCase().includes(search.toLowerCase()) || t.tags.join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter((t) => !filterSide || t.side === filterSide)
      .filter((t) => !filterSetup || t.setup === filterSetup)
      .filter((t) => !filterStatus || (t.status ?? "closed") === filterStatus)
      .filter((t) => {
        if (!dateRange) return true;
        const d = new Date(t.closeTime).getTime();
        const now = new Date();
        const start = new Date(now);
        if (dateRange === "7d") start.setDate(now.getDate() - 7);
        if (dateRange === "30d") start.setDate(now.getDate() - 30);
        if (dateRange === "90d") start.setDate(now.getDate() - 90);
        return d >= start.getTime();
      })
      .filter((t) => {
        if (!filterResult) return true;
        const p = tradePnl(t);
        if (filterResult === "win") return p > 0;
        if (filterResult === "loss") return p < 0;
        if (filterResult === "be") return p === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date-asc") return +new Date(a.closeTime) - +new Date(b.closeTime);
        if (sortBy === "pnl-desc") return tradePnl(b) - tradePnl(a);
        if (sortBy === "pnl-asc") return tradePnl(a) - tradePnl(b);
        if (sortBy === "symbol") return a.symbol.localeCompare(b.symbol);
        return +new Date(b.closeTime) - +new Date(a.closeTime);
      });
  }, [trades, search, filterSide, filterSetup, filterResult, filterStatus, dateRange, sortBy]);

  const activeFilters = [search, filterSide, filterSetup, filterResult, filterStatus, dateRange].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
            <input className="input !pl-9" placeholder="Search symbol, notes, tag…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8b94a8]"><Filter size={13} /> Filters:</div>
          <select className="select !w-auto" value={filterSide} onChange={(e) => setFilterSide(e.target.value)}>
            <option value="">All sides</option><option value="long">Long</option><option value="short">Short</option>
          </select>
          <select className="select !w-auto" value={filterSetup} onChange={(e) => setFilterSetup(e.target.value)}>
            <option value="">All setups</option>
            {playbooks.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
          <select className="select !w-auto" value={filterResult} onChange={(e) => setFilterResult(e.target.value)}>
            <option value="">All results</option><option value="win">Wins</option><option value="loss">Losses</option><option value="be">Break-even</option>
          </select>
          <select className="select !w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option><option value="closed">Closed</option><option value="open">Open</option><option value="pending">Pending</option><option value="invalid">Invalid</option><option value="cancelled">Cancelled</option>
          </select>
          <select className="select !w-auto" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="">All time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option>
          </select>
          <select className="select !w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="pnl-desc">P&L high to low</option><option value="pnl-asc">P&L low to high</option><option value="symbol">Symbol A-Z</option>
          </select>
          {activeFilters > 0 && (
            <button className="btn btn-ghost text-xs" onClick={() => { setSearch(""); setFilterSide(""); setFilterSetup(""); setFilterResult(""); setFilterStatus(""); setDateRange(""); }}>
              Clear {activeFilters}
            </button>
          )}
          <div className="ml-auto text-sm text-[#8b94a8]">{filtered.length} of {trades.length}</div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-[#8b94a8] bg-white/[0.02]">
              <tr>
                <th className="text-left py-2.5 px-3">Date</th>
                <th className="text-left py-2.5 px-3">Symbol</th>
                <th className="text-left py-2.5 px-3">Side</th>
                <th className="text-left py-2.5 px-3">Status</th>
                <th className="text-right py-2.5 px-3">Qty</th>
                <th className="text-right py-2.5 px-3">Entry</th>
                <th className="text-right py-2.5 px-3">Exit</th>
                <th className="text-right py-2.5 px-3">R</th>
                <th className="text-right py-2.5 px-3">P&L</th>
                <th className="text-left py-2.5 px-3">Setup</th>
                <th className="text-left py-2.5 px-3">Tags</th>
                <th className="text-center py-2.5 px-3">Rate</th>
                <th className="text-right py-2.5 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const p = tradePnl(t);
                const r = tradeR(t);
                return (
                  <tr key={t.id} className="border-t border-[#1f2a3d]/60 hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-[#a3acc0] text-xs whitespace-nowrap">{new Date(t.closeTime).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</td>
                    <td className="py-2 px-3 font-medium">{t.symbol}</td>
                    <td className="py-2 px-3">
                      <span className={`chip ${t.side === "long" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>{t.side.toUpperCase()}</span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`chip ${
                        (t.status ?? "closed") === "closed" ? "bg-indigo-500/10 text-indigo-300" :
                        (t.status ?? "closed") === "open" ? "bg-emerald-500/10 text-emerald-300" :
                        (t.status ?? "closed") === "pending" ? "bg-amber-500/10 text-amber-300" :
                        "bg-white/5 text-[#a3acc0]"
                      }`}>{(t.status ?? "closed").toUpperCase()}</span>
                    </td>
                    <td className="py-2 px-3 text-right text-[#a3acc0]">{t.qty}</td>
                    <td className="py-2 px-3 text-right text-[#a3acc0]">{t.entry.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-[#a3acc0]">{t.exit.toFixed(2)}</td>
                    <td className={`py-2 px-3 text-right text-xs ${r && r >= 0 ? "text-emerald-400" : r ? "text-rose-400" : "text-[#8b94a8]"}`}>{r ? `${r.toFixed(2)}R` : "—"}</td>
                    <td className={`py-2 px-3 text-right font-semibold ${p >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtCurrency(p, account.currency)}</td>
                    <td className="py-2 px-3 text-[#a3acc0] text-xs">{t.setup || "—"}</td>
                    <td className="py-2 px-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {t.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="chip bg-indigo-500/10 text-indigo-300">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="text-amber-400">{"★".repeat(t.rating)}<span className="text-[#2c3a55]">{"★".repeat(5 - t.rating)}</span></span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="inline-flex gap-1">
                        <button className="p-1.5 rounded-md hover:bg-white/5 text-[#8b94a8] hover:text-white" onClick={() => setEditing(t)}><Pencil size={14} /></button>
                        <button className="p-1.5 rounded-md hover:bg-rose-500/10 text-[#8b94a8] hover:text-rose-400" onClick={() => { if (confirm("Archive this trade? It will be hidden from stats but kept in your backup.")) deleteTrade(t.id); }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={13} className="py-10 text-center text-[#8b94a8]">No trades match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Trade" maxWidth="max-w-3xl">
        {editing && (
          <TradeForm
            initial={editing}
            playbooks={playbooks}
            accountId={account.id}
            onCancel={() => setEditing(null)}
            onSubmit={(patch) => { updateTrade(editing.id, patch); setEditing(null); }}
          />
        )}
      </Modal>
    </div>
  );
};
