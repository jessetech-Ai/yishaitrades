import { useState } from "react";
import type { Connection, Account, Trade } from "../lib/types";
import { Modal } from "../components/Modal";
import { parsePastedAlert } from "../lib/connections";
import {
  Plug, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle,
  Activity, Copy, Zap, ExternalLink, Clipboard,
} from "lucide-react";

const TV_SAMPLE = `{
  "symbol": "{{ticker}}",
  "side": "{{strategy.order.action}}",
  "qty": {{strategy.order.contracts}},
  "price": {{close}},
  "stop": {{plot_0}},
  "target": {{plot_1}},
  "setup": "ORB Breakout",
  "time": "{{timenow}}"
}`;

const ConnForm = ({
  initial, accounts, onCancel, onSubmit,
}: {
  initial?: Connection;
  accounts: Account[];
  onCancel: () => void;
  onSubmit: (c: Omit<Connection, "id">) => void;
}) => {
  const [form, setForm] = useState<Omit<Connection, "id">>(initial ?? {
    type: "mt5", name: "", enabled: true,
    baseUrl: "http://127.0.0.1:5000",
    apiKey: "",
    webhookToken: "",
    accountId: accounts[0]?.id ?? "",
    symbolFilter: "",
    importedIds: [],
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Connection Type</label>
          <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Connection["type"] })}>
            <option value="mt5">MT5 REST Bridge</option>
            <option value="tradingview">TradingView Webhook</option>
          </select>
        </div>
        <div><label className="label">Display Name</label>
          <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My MT5 Live" />
        </div>
        <div><label className="label">Target Account</label>
          <select className="select" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div><label className="label">Symbol Filter (optional)</label>
          <input className="input" value={form.symbolFilter} onChange={(e) => setForm({ ...form, symbolFilter: e.target.value })} placeholder="EURUSD, XAUUSD" />
        </div>
      </div>

      {form.type === "mt5" && (
        <>
          <div><label className="label">MT5 REST Server URL</label>
            <input className="input" value={form.baseUrl} onChange={(e) => setForm({ ...form, baseUrl: e.target.value })} placeholder="http://127.0.0.1:5000" />
          </div>
          <div><label className="label">API Key / Token (optional)</label>
            <input className="input" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} placeholder="secret-key" />
          </div>
          <div className="text-xs text-[#8b94a8] bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
            <div className="font-semibold text-indigo-300 mb-1">Setup</div>
            Run an MT5 REST bridge on your trading PC (e.g.{" "}
            <a className="underline" target="_blank" rel="noopener noreferrer" href="https://github.com/mikha-dev/mt5-rest">mikha-dev/mt5-rest</a>{" "}
            or <a className="underline" target="_blank" rel="noopener noreferrer" href="https://github.com/DevRico003/mt5-rest-api">DevRico003/mt5-rest-api</a>).
            YishaiEdge will poll <code className="text-indigo-200">/deals</code> or <code className="text-indigo-200">/history</code> and import new tickets automatically.
          </div>
        </>
      )}

      {form.type === "tradingview" && (
        <>
          <div><label className="label">webhook.site Token (UUID)</label>
            <input className="input" value={form.webhookToken} onChange={(e) => setForm({ ...form, webhookToken: e.target.value })} placeholder="00000000-0000-0000-0000-000000000000" />
          </div>
          <div className="text-xs text-[#8b94a8] bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3 space-y-2">
            <div className="font-semibold text-indigo-300">Setup (3 steps)</div>
            <div>1. Go to <a className="underline" target="_blank" rel="noopener noreferrer" href="https://webhook.site">webhook.site</a> and copy your unique URL (the UUID after the slash).</div>
            <div>2. In TradingView alerts, set <span className="text-indigo-200">Webhook URL</span> to that URL.</div>
            <div>3. Paste the JSON template (below) into the alert "Message" field.</div>
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" id="enabled" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-indigo-500" />
        <label htmlFor="enabled" className="text-sm">Enabled (auto-sync)</label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? "Save" : "Add Connection"}</button>
      </div>
    </form>
  );
};

const PasteAlertForm = ({ accountId, onCancel, onSubmit }: {
  accountId: string; onCancel: () => void; onSubmit: (t: Trade) => void;
}) => {
  const [text, setText] = useState(`{
  "symbol": "EURUSD",
  "side": "buy",
  "qty": 1,
  "entry": 1.0850,
  "exit": 1.0890,
  "stop": 1.0830,
  "setup": "ORB Breakout"
}`);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-3">
      <p className="text-sm text-[#8b94a8]">Paste a TradingView alert payload (JSON) to import as a trade.</p>
      <textarea className="textarea font-mono text-xs" rows={12} value={text} onChange={(e) => setText(e.target.value)} />
      {err && <div className="text-rose-400 text-xs">{err}</div>}
      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={() => {
          const t = parsePastedAlert(text, accountId);
          if (!t) { setErr("Could not parse — make sure it's valid JSON with at least 'symbol'."); return; }
          onSubmit(t);
        }}>Import</button>
      </div>
    </div>
  );
};

export const Connections = ({
  connections, accounts, syncIntervalSec, lastSyncRunAt, syncing,
  addConnection, updateConnection, deleteConnection, setSyncInterval,
  syncAll, addTrade,
}: {
  connections: Connection[];
  accounts: Account[];
  syncIntervalSec: number;
  lastSyncRunAt: string | null;
  syncing: boolean;
  addConnection: (c: Omit<Connection, "id">) => void;
  updateConnection: (id: string, patch: Partial<Connection>) => void;
  deleteConnection: (id: string) => void;
  setSyncInterval: (s: number) => void;
  syncAll: (id?: string) => Promise<void>;
  addTrade: (t: Omit<Trade, "id">) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Connection | null>(null);
  const [paste, setPaste] = useState(false);
  const [copied, setCopied] = useState("");

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="card p-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent border-indigo-500/30">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center"><Plug size={20} /></div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">Auto-sync your trades</h2>
            <p className="text-sm text-[#a3acc0] mt-1">
              Connect MT5 (via a local REST bridge) and TradingView (via webhook.site relay).
              YishaiEdge automatically pulls new trades, dedupes them, and updates every chart, KPI, and insight in real-time.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity size={15} className={syncing ? "text-emerald-400 animate-pulse" : "text-[#8b94a8]"} />
          <span className="text-sm">{syncing ? "Syncing…" : "Idle"}</span>
        </div>
        <div className="text-xs text-[#8b94a8]">
          Last run: {lastSyncRunAt ? new Date(lastSyncRunAt).toLocaleTimeString() : "—"}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#8b94a8]">Auto-sync every</span>
          <select className="select !w-auto !py-1.5" value={syncIntervalSec} onChange={(e) => setSyncInterval(+e.target.value)}>
            <option value={0}>Off</option>
            <option value={15}>15 sec</option>
            <option value={30}>30 sec</option>
            <option value={60}>1 min</option>
            <option value={300}>5 min</option>
            <option value={900}>15 min</option>
          </select>
          <button className="btn btn-ghost" onClick={() => syncAll()} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Sync now
          </button>
          <button className="btn btn-ghost" onClick={() => setPaste(true)}><Clipboard size={14} /> Paste Alert</button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={14} /> New Connection</button>
        </div>
      </div>

      {connections.length === 0 && (
        <div className="card p-10 text-center text-[#8b94a8]">
          <Plug size={28} className="mx-auto mb-2 text-indigo-300/60" />
          No connections yet. Add MT5 or TradingView to start importing trades automatically.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {connections.map((c) => {
          const account = accounts.find((a) => a.id === c.accountId);
          return (
            <div key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.type === "mt5" ? "bg-amber-500/15 text-amber-400" : "bg-indigo-500/15 text-indigo-300"}`}>
                    <Zap size={17} />
                  </div>
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {c.name}
                      <span className="chip bg-white/5 border border-[#1f2a3d] uppercase">{c.type}</span>
                    </div>
                    <div className="text-xs text-[#8b94a8]">→ {account?.name ?? "Unknown account"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    className={`chip cursor-pointer ${c.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-[#8b94a8]"}`}
                    onClick={() => updateConnection(c.id, { enabled: !c.enabled })}
                  >
                    {c.enabled ? "ON" : "OFF"}
                  </button>
                </div>
              </div>

              <div className="mt-3 text-xs space-y-1 text-[#a3acc0]">
                {c.type === "mt5" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#8b94a8]">URL:</span>
                    <code className="text-indigo-200 truncate">{c.baseUrl}</code>
                  </div>
                )}
                {c.type === "tradingview" && c.webhookToken && (
                  <div className="flex items-center gap-2">
                    <span className="text-[#8b94a8]">Hook:</span>
                    <code className="text-indigo-200 truncate text-[10px]">https://webhook.site/{c.webhookToken}</code>
                    <button className="text-[#8b94a8] hover:text-white" onClick={() => copy(`https://webhook.site/${c.webhookToken}`, c.id)}>
                      {copied === c.id ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
                {c.symbolFilter && <div><span className="text-[#8b94a8]">Filter:</span> {c.symbolFilter}</div>}
                <div><span className="text-[#8b94a8]">Imported:</span> {c.importedIds?.length ?? 0} trades</div>
                <div><span className="text-[#8b94a8]">Last sync:</span> {c.lastSync ? new Date(c.lastSync).toLocaleString() : "Never"}</div>
                {c.lastError && (
                  <div className="flex items-start gap-1 text-rose-400 mt-1">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" /> <span>{c.lastError}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <button className="btn btn-ghost" onClick={() => syncAll(c.id)} disabled={syncing}>
                  <RefreshCw size={13} /> Sync
                </button>
                <button className="btn btn-ghost" onClick={() => setEditing(c)}>Edit</button>
                <button className="btn btn-danger ml-auto" onClick={() => { if (confirm("Delete this connection?")) deleteConnection(c.id); }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup guides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold">MT5</span>
            MT5 Setup Guide
          </h3>
          <ol className="text-sm text-[#cbd1de] space-y-2 list-decimal list-inside">
            <li>Install Python on your MT5 trading PC.</li>
            <li>Clone an open-source bridge: <a className="text-indigo-300 underline inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer" href="https://github.com/DevRico003/mt5-rest-api">DevRico003/mt5-rest-api <ExternalLink size={11} /></a></li>
            <li>Run <code className="text-indigo-200 bg-white/5 px-1 rounded">python server.py</code> — exposes <code className="text-indigo-200">http://127.0.0.1:5000</code>.</li>
            <li>Add an MT5 connection here pointing to that URL.</li>
            <li>Enable auto-sync — closed deals flow into YishaiEdge automatically.</li>
          </ol>
          <p className="text-xs text-[#8b94a8] mt-3">
            ⚠️ Browsers block <code>http://</code> calls from <code>https://</code> pages. Open YishaiEdge over <code>http://</code> when using a local bridge, or run the bridge with an HTTPS reverse proxy (e.g. ngrok).
          </p>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs font-bold">TV</span>
            TradingView Alert JSON Template
          </h3>
          <p className="text-sm text-[#cbd1de] mb-2">Paste this into the alert's "Message" field. Replace placeholders for your strategy:</p>
          <div className="relative">
            <pre className="bg-[#0a0f1c] border border-[#1f2a3d] rounded-lg p-3 text-xs text-[#cbd1de] overflow-x-auto">{TV_SAMPLE}</pre>
            <button
              className="absolute top-2 right-2 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-[#8b94a8] hover:text-white"
              onClick={() => copy(TV_SAMPLE, "tv-tpl")}
              title="Copy template"
            >
              {copied === "tv-tpl" ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
            </button>
          </div>
          <p className="text-xs text-[#8b94a8] mt-3">
            YishaiEdge auto-extracts <code>symbol</code>, <code>side</code>, <code>qty</code>, <code>entry/exit</code>, <code>stop</code>, <code>target</code>, <code>setup</code>, and <code>time</code>. Unknown fields are stored in notes.
          </p>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Connection" maxWidth="max-w-2xl">
        <ConnForm accounts={accounts} onCancel={() => setOpen(false)} onSubmit={(c) => { addConnection(c); setOpen(false); }} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Connection" maxWidth="max-w-2xl">
        {editing && (
          <ConnForm
            initial={editing}
            accounts={accounts}
            onCancel={() => setEditing(null)}
            onSubmit={(c) => { updateConnection(editing.id, c); setEditing(null); }}
          />
        )}
      </Modal>
      <Modal open={paste} onClose={() => setPaste(false)} title="Paste TradingView Alert">
        <PasteAlertForm
          accountId={accounts[0]?.id ?? ""}
          onCancel={() => setPaste(false)}
          onSubmit={(t) => { addTrade(t); setPaste(false); }}
        />
      </Modal>
    </div>
  );
};
