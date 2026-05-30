import { useState, useEffect, useMemo } from "react";
import type { Trade, Playbook } from "../lib/types";
import { tradePnl, fmtCurrency, tradeR } from "../lib/calc";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

const toLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface ValidationError {
  field: string;
  message: string;
  type: "error" | "warning";
}

const validate = (form: Omit<Trade, "id">): ValidationError[] => {
  const errors: ValidationError[] = [];
  if (!form.symbol.trim()) errors.push({ field: "symbol", message: "Symbol is required", type: "error" });
  if (form.entry <= 0) errors.push({ field: "entry", message: "Entry price must be positive", type: "error" });
  if (form.exit <= 0) errors.push({ field: "exit", message: "Exit price must be positive", type: "error" });
  if (form.qty <= 0) errors.push({ field: "qty", message: "Quantity must be positive", type: "error" });
  if (form.fees < 0) errors.push({ field: "fees", message: "Fees cannot be negative", type: "error" });
  if (new Date(form.openTime) > new Date(form.closeTime)) errors.push({ field: "closeTime", message: "Close time must be after open time", type: "error" });
  const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  if (new Date(form.openTime) < oneYearAgo) errors.push({ field: "openTime", message: "Trade is over 1 year old — verify the date", type: "warning" });
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (new Date(form.closeTime) > tomorrow) errors.push({ field: "closeTime", message: "Close time is in the future", type: "warning" });
  if (form.entry === form.exit) errors.push({ field: "exit", message: "Entry = exit: this is a zero-profit trade", type: "warning" });
  if (form.stopLoss !== undefined && form.stopLoss <= 0) errors.push({ field: "stopLoss", message: "Stop loss must be positive", type: "error" });
  return errors;
};

export const TradeForm = ({
  initial, playbooks, accountId, onCancel, onSubmit,
}: {
  initial?: Trade;
  playbooks: Playbook[];
  accountId: string;
  onCancel: () => void;
  onSubmit: (t: Omit<Trade, "id">) => void;
}) => {
  const now = new Date();
  const later = new Date(now.getTime() + 30 * 60000);

  const [form, setForm] = useState<Omit<Trade, "id">>(
    initial ?? {
      symbol: "", side: "long", qty: 100, entry: 0, exit: 0, fees: 1,
      status: "closed",
      openTime: now.toISOString(), closeTime: later.toISOString(),
      setup: playbooks[0]?.name ?? "", account: accountId, notes: "",
      tags: [], rating: 3, stopLoss: undefined, takeProfit: undefined, emotion: "calm",
    }
  );

  const [touched, setTouched] = useState(false);

  useEffect(() => { if (initial) setForm(initial); }, [initial]);

  const update = <K extends keyof Omit<Trade, "id">>(k: K, v: Omit<Trade, "id">[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = errors.some((e) => e.type === "error");
  const warnings = errors.filter((e) => e.type === "warning");

  // Preview P&L
  const previewPnl = useMemo(() => {
    if (form.entry > 0 && form.exit > 0 && form.qty > 0) {
      return tradePnl(form as Trade);
    }
    return null;
  }, [form]);

  const previewR = useMemo(() => {
    if (form.entry > 0 && form.exit > 0 && form.qty > 0 && form.stopLoss) {
      return tradeR(form as Trade);
    }
    return null;
  }, [form]);

  const fieldErr = (field: string) => {
    if (!touched) return null;
    return errors.find((e) => e.field === field && e.type === "error");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;
    onSubmit({ ...form, symbol: form.symbol.toUpperCase().trim() });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Live preview bar */}
      {previewPnl !== null && form.entry > 0 && (
        <div className={`flex items-center gap-4 rounded-lg p-3 border text-sm ${
          previewPnl >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"
        }`}>
          <div className="flex items-center gap-1.5">
            {previewPnl >= 0 ? <TrendingUp size={14} className="text-emerald-400" /> : <TrendingDown size={14} className="text-rose-400" />}
            <span className={`font-semibold ${previewPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {fmtCurrency(previewPnl)}
            </span>
          </div>
          <div className="text-[#8b94a8] text-xs">
            {((Math.abs(form.exit - form.entry) / form.entry) * 100).toFixed(2)}% move
          </div>
          {previewR !== null && (
            <div className={`text-xs font-medium ${previewR >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {previewR.toFixed(2)}R
            </div>
          )}
          <div className="ml-auto text-xs text-[#8b94a8]">
            {previewPnl >= 0 ? "Winner" : "Loser"} preview
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="label">Symbol</label>
          <input className={`input ${fieldErr("symbol") ? "!border-rose-500" : ""}`} required value={form.symbol} onChange={(e) => update("symbol", e.target.value)} placeholder="AAPL" />
          {fieldErr("symbol") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("symbol")!.message}</span>}
        </div>
        <div><label className="label">Side</label>
          <select className="select" value={form.side} onChange={(e) => update("side", e.target.value as Trade["side"])}>
            <option value="long">Long ↑</option><option value="short">Short ↓</option>
          </select>
        </div>
        <div><label className="label">Status</label>
          <select className="select" value={form.status ?? "closed"} onChange={(e) => update("status", e.target.value as Trade["status"])}>
            <option value="closed">Closed</option><option value="open">Open</option><option value="pending">Pending</option>
            <option value="invalid">Invalid</option><option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="label">Quantity</label>
          <input type="number" step="any" className={`input ${fieldErr("qty") ? "!border-rose-500" : ""}`} value={form.qty} onChange={(e) => update("qty", +e.target.value)} />
          {fieldErr("qty") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("qty")!.message}</span>}
        </div>
        <div>
          <label className="label">Fees</label>
          <input type="number" step="any" className={`input ${fieldErr("fees") ? "!border-rose-500" : ""}`} value={form.fees} onChange={(e) => update("fees", +e.target.value)} />
          {fieldErr("fees") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("fees")!.message}</span>}
        </div>
        <div>
          <label className="label">Entry Price</label>
          <input type="number" step="any" className={`input ${fieldErr("entry") ? "!border-rose-500" : ""}`} value={form.entry} onChange={(e) => update("entry", +e.target.value)} />
          {fieldErr("entry") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("entry")!.message}</span>}
        </div>
        <div>
          <label className="label">Exit Price</label>
          <input type="number" step="any" className={`input ${fieldErr("exit") ? "!border-rose-500" : ""}`} value={form.exit} onChange={(e) => update("exit", +e.target.value)} />
          {fieldErr("exit") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("exit")!.message}</span>}
        </div>
        <div>
          <label className="label">Stop Loss</label>
          <input type="number" step="any" className={`input ${fieldErr("stopLoss") ? "!border-rose-500" : ""}`} value={form.stopLoss ?? ""} onChange={(e) => update("stopLoss", e.target.value ? +e.target.value : undefined)} />
        </div>
        <div><label className="label">Take Profit</label><input type="number" step="any" className="input" value={form.takeProfit ?? ""} onChange={(e) => update("takeProfit", e.target.value ? +e.target.value : undefined)} /></div>
        <div><label className="label">Risk %</label><input type="number" step="any" className="input" value={form.riskPercent ?? ""} onChange={(e) => update("riskPercent", e.target.value ? +e.target.value : undefined)} placeholder="1.0" /></div>
        <div><label className="label">Reward %</label><input type="number" step="any" className="input" value={form.rewardPercent ?? ""} onChange={(e) => update("rewardPercent", e.target.value ? +e.target.value : undefined)} placeholder="2.0" /></div>
        <div>
          <label className="label">Open Time</label>
          <input type="datetime-local" className={`input ${fieldErr("openTime") ? "!border-rose-500" : ""}`} value={toLocal(form.openTime)} onChange={(e) => update("openTime", new Date(e.target.value).toISOString())} />
          {fieldErr("openTime") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("openTime")!.message}</span>}
        </div>
        <div>
          <label className="label">Close Time</label>
          <input type="datetime-local" className={`input ${fieldErr("closeTime") ? "!border-rose-500" : ""}`} value={toLocal(form.closeTime)} onChange={(e) => update("closeTime", new Date(e.target.value).toISOString())} />
          {fieldErr("closeTime") && <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {fieldErr("closeTime")!.message}</span>}
        </div>
        <div><label className="label">Setup</label>
          <select className="select" value={form.setup} onChange={(e) => update("setup", e.target.value)}>
            <option value="">— None —</option>
            {playbooks.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
          </select>
        </div>
        <div><label className="label">Emotion</label>
          <select className="select" value={form.emotion} onChange={(e) => update("emotion", e.target.value as Trade["emotion"])}>
            <option value="calm">😌 Calm</option><option value="confident">💪 Confident</option><option value="fomo">🏃 FOMO</option>
            <option value="fear">😰 Fear</option><option value="greed">🤑 Greed</option><option value="frustrated">😤 Frustrated</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">Discipline Rating: {["", "😫", "😟", "😐", "🙂", "🤩"][form.rating]} {form.rating}/5</label>
          <input type="range" min={1} max={5} value={form.rating} onChange={(e) => update("rating", +e.target.value)} className="w-full accent-indigo-500" />
        </div>
        <div>
          <label className="label">Tags (comma separated)</label>
          <input className="input" value={form.tags.join(", ")} onChange={(e) => update("tags", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="A+ setup, breakout" />
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="textarea" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="What was your thesis? Did you follow the plan? What would you do differently?" />
      </div>

      {/* Warnings */}
      {touched && warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="text-xs text-amber-300 flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-1.5">
              <AlertCircle size={12} /> {w.message}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className={`btn ${touched && hasErrors ? "bg-rose-500/20 border-rose-500/30 text-rose-300 cursor-not-allowed" : "btn-primary"}`}>
          {initial ? "Save Changes" : "Add Trade"}
        </button>
      </div>
    </form>
  );
};
