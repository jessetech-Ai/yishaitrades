import { useMemo, useState } from "react";
import type { Goal, Trade } from "../lib/types";
import { computeStats, fmtCurrency, fmtPct } from "../lib/calc";
import { Modal } from "../components/Modal";
import { Plus, Target, Trash2, Pencil, Check } from "lucide-react";

const GoalForm = ({
  initial, onCancel, onSubmit,
}: { initial?: Goal; onCancel: () => void; onSubmit: (g: Omit<Goal, "id">) => void }) => {
  const [form, setForm] = useState<Omit<Goal, "id">>(initial ?? {
    title: "", target: 0, current: 0, type: "pnl",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Type</label>
          <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Goal["type"] })}>
            <option value="pnl">Net P&L</option>
            <option value="winrate">Win Rate (%)</option>
            <option value="trades">Trade Count</option>
            <option value="rr">Avg R Multiple</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div><label className="label">Target</label><input type="number" step="any" className="input" value={form.target} onChange={(e) => setForm({ ...form, target: +e.target.value })} /></div>
      </div>
      <div><label className="label">Deadline (optional)</label><input type="date" className="input" value={form.deadline ?? ""} onChange={(e) => setForm({ ...form, deadline: e.target.value || undefined })} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? "Save" : "Add Goal"}</button>
      </div>
    </form>
  );
};

const currentValue = (goal: Goal, trades: Trade[]): number => {
  const stats = computeStats(trades);
  switch (goal.type) {
    case "pnl": return stats.totalPnl;
    case "winrate": return stats.winRate;
    case "trades": return stats.trades;
    case "rr": return stats.avgRR;
    default: return goal.current;
  }
};

const formatVal = (g: Goal, v: number) => {
  switch (g.type) {
    case "pnl": return fmtCurrency(v);
    case "winrate": return fmtPct(v);
    case "rr": return `${v.toFixed(2)}R`;
    default: return v.toFixed(0);
  }
};

export const Goals = ({
  goals, trades, addGoal, updateGoal, deleteGoal,
}: {
  goals: Goal[]; trades: Trade[];
  addGoal: (g: Omit<Goal, "id">) => void;
  updateGoal: (id: string, p: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);

  // Filter trades to current month for goal progress
  const monthTrades = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}`;
    return trades.filter((t) => t.closeTime.startsWith(ym));
  }, [trades]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b94a8]">Track monthly targets — what gets measured gets improved.</p>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Goal</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((g) => {
          const cur = currentValue(g, monthTrades);
          const pct = g.target ? Math.min(Math.max((cur / g.target) * 100, 0), 100) : 0;
          const reached = cur >= g.target;
          return (
            <div key={g.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${reached ? "bg-emerald-500/20 text-emerald-400" : "bg-indigo-500/15 text-indigo-300"}`}>
                    {reached ? <Check size={17} /> : <Target size={16} />}
                  </div>
                  <div>
                    <div className="font-semibold">{g.title}</div>
                    <div className="text-xs text-[#8b94a8]">{g.type.toUpperCase()} · this month</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded hover:bg-white/5 text-[#8b94a8]" onClick={() => setEditing(g)}><Pencil size={14} /></button>
                  <button className="p-1.5 rounded hover:bg-rose-500/10 text-[#8b94a8] hover:text-rose-400" onClick={() => { if (confirm("Delete goal?")) deleteGoal(g.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-semibold ${reached ? "text-emerald-400" : "text-white"}`}>{formatVal(g, cur)}</span>
                  <span className="text-xs text-[#8b94a8]">of {formatVal(g, g.target)}</span>
                </div>
                <div className="mt-2 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${reached ? "bg-gradient-to-r from-emerald-500 to-emerald-400" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-[#8b94a8] text-right">{pct.toFixed(0)}%</div>
              </div>
              {g.deadline && <div className="mt-2 text-xs text-[#8b94a8]">Deadline: {new Date(g.deadline).toLocaleDateString()}</div>}
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="md:col-span-3 card p-10 text-center text-[#8b94a8]">No goals yet. Set your first target.</div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Goal">
        <GoalForm onCancel={() => setOpen(false)} onSubmit={(g) => { addGoal(g); setOpen(false); }} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Goal">
        {editing && <GoalForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(g) => { updateGoal(editing.id, g); setEditing(null); }} />}
      </Modal>
    </div>
  );
};
