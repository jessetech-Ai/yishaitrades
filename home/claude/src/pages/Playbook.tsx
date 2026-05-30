import { useState } from "react";
import type { Playbook as PB, Trade } from "../lib/types";
import { Modal } from "../components/Modal";
import { fmtCurrency, fmtPct, computeStats } from "../lib/calc";
import { Plus, Pencil, Trash2, BookOpen, CheckCircle2 } from "lucide-react";

const PBForm = ({
  initial, onCancel, onSubmit,
}: { initial?: PB; onCancel: () => void; onSubmit: (p: Omit<PB, "id">) => void }) => {
  const [form, setForm] = useState<Omit<PB, "id">>(initial ?? {
    name: "", description: "", rules: [], marketConditions: "", entryCriteria: "",
    exitCriteria: "", riskReward: 2, color: "#6366f1",
  });
  const [ruleText, setRuleText] = useState((initial?.rules || []).join("\n"));
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, rules: ruleText.split("\n").map(s => s.trim()).filter(Boolean) }); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="label">Target R:R</label><input type="number" step="0.1" className="input" value={form.riskReward} onChange={(e) => setForm({ ...form, riskReward: +e.target.value })} /></div>
      </div>
      <div><label className="label">Description</label><textarea className="textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div><label className="label">Market Conditions</label><input className="input" value={form.marketConditions} onChange={(e) => setForm({ ...form, marketConditions: e.target.value })} placeholder="Trend day, high volatility…" /></div>
      <div><label className="label">Entry Criteria</label><textarea className="textarea" rows={2} value={form.entryCriteria} onChange={(e) => setForm({ ...form, entryCriteria: e.target.value })} /></div>
      <div><label className="label">Exit Criteria</label><textarea className="textarea" rows={2} value={form.exitCriteria} onChange={(e) => setForm({ ...form, exitCriteria: e.target.value })} /></div>
      <div><label className="label">Checklist Rules (one per line)</label><textarea className="textarea" rows={4} value={ruleText} onChange={(e) => setRuleText(e.target.value)} /></div>
      <div><label className="label">Color</label><input type="color" className="h-10 w-20 rounded border border-[#1f2a3d] bg-[#0f1626]" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? "Save" : "Add Playbook"}</button>
      </div>
    </form>
  );
};

export const Playbook = ({
  playbooks, trades,
  addPlaybook, updatePlaybook, deletePlaybook,
}: {
  playbooks: PB[]; trades: Trade[];
  addPlaybook: (p: Omit<PB, "id">) => void;
  updatePlaybook: (id: string, p: Partial<PB>) => void;
  deletePlaybook: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PB | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b94a8]">Document your strategies — the codified edge.</p>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Playbook</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {playbooks.map((p) => {
          const pbTrades = trades.filter((t) => t.setup === p.name);
          const stats = computeStats(pbTrades);
          return (
            <div key={p.id} className="card card-hover p-4" style={{ borderTop: `3px solid ${p.color}` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.color}20`, color: p.color }}>
                    <BookOpen size={16} />
                  </div>
                  <h3 className="font-semibold">{p.name}</h3>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded hover:bg-white/5 text-[#8b94a8]" onClick={() => setEditing(p)}><Pencil size={14} /></button>
                  <button className="p-1.5 rounded hover:bg-rose-500/10 text-[#8b94a8] hover:text-rose-400" onClick={() => { if (confirm("Delete playbook?")) deletePlaybook(p.id); }}><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-sm text-[#a3acc0] mt-2">{p.description}</p>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="bg-white/[0.03] rounded-lg p-2">
                  <div className="text-[10px] text-[#8b94a8] uppercase">Trades</div>
                  <div className="font-semibold">{stats.trades}</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2">
                  <div className="text-[10px] text-[#8b94a8] uppercase">Win Rate</div>
                  <div className="font-semibold">{fmtPct(stats.winRate)}</div>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-2">
                  <div className="text-[10px] text-[#8b94a8] uppercase">P&L</div>
                  <div className={`font-semibold ${stats.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{fmtCurrency(stats.totalPnl)}</div>
                </div>
              </div>

              {p.rules.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] uppercase text-[#8b94a8] mb-1 font-semibold">Checklist</div>
                  <ul className="space-y-1">
                    {p.rules.map((r, i) => (
                      <li key={i} className="text-sm text-[#cbd1de] flex items-start gap-1.5">
                        <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="text-[#8b94a8]">Target R:R</div>
                <div className="text-right font-medium">{p.riskReward.toFixed(1)}:1</div>
                <div className="text-[#8b94a8]">Conditions</div>
                <div className="text-right truncate">{p.marketConditions}</div>
              </div>

              {(p.entryCriteria || p.exitCriteria) && (
                <details className="mt-3 text-sm">
                  <summary className="cursor-pointer text-[#8b94a8] text-xs uppercase tracking-wider">Entry / Exit</summary>
                  {p.entryCriteria && <div className="mt-2"><span className="text-[#8b94a8] text-xs">Entry:</span> {p.entryCriteria}</div>}
                  {p.exitCriteria && <div className="mt-1"><span className="text-[#8b94a8] text-xs">Exit:</span> {p.exitCriteria}</div>}
                </details>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Playbook">
        <PBForm onCancel={() => setOpen(false)} onSubmit={(p) => { addPlaybook(p); setOpen(false); }} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Playbook">
        {editing && <PBForm initial={editing} onCancel={() => setEditing(null)} onSubmit={(p) => { updatePlaybook(editing.id, p); setEditing(null); }} />}
      </Modal>
    </div>
  );
};
