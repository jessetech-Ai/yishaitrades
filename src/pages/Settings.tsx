import { useState } from "react";
import type { Account, AppState, UserProfile } from "../lib/types";
import {
  Plus, Trash2, Database, Download, Upload, User, Lock, Palette,
  BookOpen, Shield, CheckCircle2, Eye, EyeOff, Globe, Clock, Crosshair,
  Heart, AlertTriangle, Mail, Phone, MapPin, Sparkles, LogOut,
} from "lucide-react";
import { Modal } from "../components/Modal";
import { decryptState, downloadEncryptedBackup } from "../lib/cryptoVault";

const TIMEZONES = [
  "America/New_York","America/Chicago","America/Denver","America/Los_Angeles",
  "America/Anchorage","America/Toronto","America/Vancouver","America/Sao_Paulo",
  "America/Mexico_City","America/Buenos_Aires","America/Bogota",
  "Europe/London","Europe/Paris","Europe/Berlin","Europe/Zurich","Europe/Amsterdam",
  "Europe/Madrid","Europe/Rome","Europe/Stockholm","Europe/Warsaw","Europe/Moscow",
  "Europe/Istanbul","Europe/Athens","Europe/Helsinki",
  "Asia/Dubai","Asia/Riyadh","Asia/Jerusalem","Asia/Kolkata","Asia/Bangkok",
  "Asia/Singapore","Asia/Hong_Kong","Asia/Shanghai","Asia/Tokyo","Asia/Seoul",
  "Asia/Taipei",
  "Australia/Sydney","Australia/Melbourne","Australia/Perth",
  "Pacific/Auckland","Pacific/Honolulu",
  "Africa/Johannesburg","Africa/Cairo","Africa/Lagos",
  "UTC",
];

const Section = ({
  icon: Icon, title, subtitle, children, accent,
}: {
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: string;
}) => (
  <div className="card p-5">
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#1f2a3d]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent ?? "bg-indigo-500/15 text-indigo-300"}`}>
        <Icon size={18} />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-[#8b94a8]">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[160px_1fr] gap-3 items-start">
    <label className="label mt-2.5">{label}</label>
    <div>{children}</div>
  </div>
);

export const Settings = ({
  state, setState, addAccount, clearAll, resetAll, updateProfile, onAuthUpdate, onLogout,
}: {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  addAccount: (a: Omit<Account, "id">) => void;
  clearAll: () => void;
  resetAll: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
  onAuthUpdate?: (patch: { email?: string; password?: string; displayName?: string }) => void;
  onLogout?: () => void;
}) => {
  const p = state.profile;
  const [open, setOpen] = useState(false);
  const [acct, setAcct] = useState<Omit<Account, "id">>({
    name: "", startingBalance: 10000, broker: "", currency: "USD",
  });
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState("");
  const [promptDraft, setPromptDraft] = useState(p.journalPrompts.join("\n"));

  const save = (patch: Partial<UserProfile>) => {
    updateProfile(patch);
    if (patch.displayName !== undefined) onAuthUpdate?.({ displayName: patch.displayName });
    setToast("Saved!");
    setTimeout(() => setToast(""), 2000);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `yishaiedge-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result as string);
        if (data.trades && data.accounts) setState(data);
        else alert("Invalid backup file");
      } catch { alert("Could not parse JSON"); }
    };
    r.readAsText(file);
  };

  const exportEncrypted = async () => {
    const passphrase = prompt("Choose an encryption passphrase (minimum 8 characters). Store it safely; it cannot be recovered.");
    if (!passphrase) return;
    try {
      await downloadEncryptedBackup(state, passphrase);
      setToast("Encrypted backup exported!");
      setTimeout(() => setToast(""), 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not export encrypted backup");
    }
  };

  const importEncrypted = (file: File) => {
    const passphrase = prompt("Enter the passphrase for this encrypted YishaiEdge backup.");
    if (!passphrase) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const data = await decryptState(r.result as string, passphrase);
        if (data.trades && data.accounts) setState(data);
        else alert("Invalid decrypted backup file");
      } catch {
        alert("Could not decrypt backup. Check the file and passphrase.");
      }
    };
    r.readAsText(file);
  };

  // Avatar initials from name
  const initials = p.firstName || p.lastName
    ? `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase()
    : null;

  return (
    <div className="space-y-4 max-w-4xl">
      {/* ===== PROFILE ===== */}
      <Section icon={User} title="Profile" subtitle="Your personal details" accent="bg-violet-500/15 text-violet-300">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-500/30 select-none">
            {initials || p.avatar}
          </div>
          <div>
            <div className="text-xl font-semibold">{p.displayName || "Trader"}</div>
            <div className="text-sm text-[#8b94a8]">{p.email || "No email set"}</div>
            <div className="text-xs text-[#8b94a8] mt-0.5 flex items-center gap-1">
              <Globe size={11} /> {p.timezone}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Row label="First Name">
              <input className="input" value={p.firstName} onChange={(e) => save({ firstName: e.target.value })} placeholder="Yishai" />
            </Row>
            <Row label="Last Name">
              <input className="input" value={p.lastName} onChange={(e) => save({ lastName: e.target.value })} placeholder="Cohen" />
            </Row>
          </div>
          <Row label="Display Name">
            <input className="input" value={p.displayName} onChange={(e) => save({ displayName: e.target.value })} placeholder="How should we call you?" />
          </Row>
          <Row label="Avatar / Emoji">
            <input className="input !w-24" value={p.avatar} maxLength={4} onChange={(e) => save({ avatar: e.target.value })} />
            <span className="text-xs text-[#8b94a8] ml-2">Emoji or 1-2 chars. Overridden by initials when name is set.</span>
          </Row>
          <Row label="Bio">
            <textarea className="textarea" rows={2} value={p.bio} onChange={(e) => save({ bio: e.target.value })} placeholder="Momentum day-trader, 3 years experience..." />
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Phone">
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
                <input className="input !pl-9" value={p.phone} onChange={(e) => save({ phone: e.target.value })} placeholder="+1 555-0100" />
              </div>
            </Row>
            <Row label="Location">
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
                <input className="input !pl-9" value={p.location} onChange={(e) => save({ location: e.target.value })} placeholder="New York, NY" />
              </div>
            </Row>
          </div>
          <Row label="Timezone">
            <select className="select" value={p.timezone} onChange={(e) => save({ timezone: e.target.value })}>
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Row>
        </div>
      </Section>

      {/* ===== EMAIL & PASSWORD (SECURITY) ===== */}
      <Section icon={Lock} title="Security" subtitle="Email & password" accent="bg-rose-500/15 text-rose-300">
        <div className="space-y-3">
          <Row label="Email Address">
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
              <input
                type="email"
                className="input !pl-9"
                value={p.email}
                onChange={(e) => { save({ email: e.target.value }); onAuthUpdate?.({ email: e.target.value }); }}
                placeholder="you@example.com"
              />
            </div>
          </Row>
          <Row label="Password">
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b94a8]" />
              <input
                type={showPw ? "text" : "password"}
                className="input !pl-9 !pr-10"
                value={p.password}
                onChange={(e) => { save({ password: e.target.value }); onAuthUpdate?.({ password: e.target.value }); }}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b94a8] hover:text-white"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-[11px] text-[#8b94a8] mt-1">
              <Shield size={10} className="inline mr-0.5" />
              Stored locally in your browser only. Not sent anywhere.
            </p>
          </Row>
          {onLogout && (
            <Row label="Session">
              <button className="btn btn-danger" onClick={onLogout}>
                <LogOut size={14} /> Log Out
              </button>
            </Row>
          )}
        </div>
      </Section>

      {/* ===== TRADING IDENTITY ===== */}
      <Section icon={Crosshair} title="Trading Identity" subtitle="Your trading profile & risk rules" accent="bg-amber-500/15 text-amber-300">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Trading Style">
              <select className="select" value={p.tradingStyle} onChange={(e) => save({ tradingStyle: e.target.value as UserProfile["tradingStyle"] })}>
                <option value="scalper">Scalper</option>
                <option value="day-trader">Day Trader</option>
                <option value="swing">Swing Trader</option>
                <option value="position">Position Trader</option>
                <option value="other">Other</option>
              </select>
            </Row>
            <Row label="Experience">
              <select className="select" value={p.experienceLevel} onChange={(e) => save({ experienceLevel: e.target.value as UserProfile["experienceLevel"] })}>
                <option value="beginner">Beginner ({"<"}1yr)</option>
                <option value="intermediate">Intermediate (1-3yr)</option>
                <option value="advanced">Advanced (3-7yr)</option>
                <option value="professional">Professional (7yr+)</option>
              </select>
            </Row>
          </div>
          <Row label="Preferred Markets">
            <input className="input" value={p.preferredMarkets} onChange={(e) => save({ preferredMarkets: e.target.value })} placeholder="US Equities, Forex, Crypto" />
          </Row>
          <Row label="Risk Tolerance">
            <div className="flex gap-2">
              {(["conservative", "moderate", "aggressive"] as const).map((lvl) => (
                <button
                  key={lvl}
                  className={`btn flex-1 capitalize ${p.riskTolerance === lvl
                    ? (lvl === "aggressive" ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                      : lvl === "moderate" ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300")
                    : "btn-ghost"}`}
                  onClick={() => save({ riskTolerance: lvl })}
                >
                  {lvl === "conservative" && <Shield size={13} />}
                  {lvl === "moderate" && <Heart size={13} />}
                  {lvl === "aggressive" && <AlertTriangle size={13} />}
                  {lvl}
                </button>
              ))}
            </div>
          </Row>
          <div className="grid grid-cols-2 gap-3">
            <Row label="Max Daily Loss ($)">
              <input type="number" className="input" value={p.maxDailyLoss} onChange={(e) => save({ maxDailyLoss: +e.target.value })} />
            </Row>
            <Row label="Max Daily Trades">
              <input type="number" className="input" value={p.maxDailyTrades} onChange={(e) => save({ maxDailyTrades: +e.target.value })} />
            </Row>
          </div>
        </div>
      </Section>

      {/* ===== JOURNAL PERSONALIZATION ===== */}
      <Section icon={BookOpen} title="Journal Personalization" subtitle="Customize your journaling experience" accent="bg-emerald-500/15 text-emerald-300">
        <div className="space-y-3">
          <Row label="Greeting">
            <input className="input" value={p.journalGreeting} onChange={(e) => save({ journalGreeting: e.target.value })} placeholder="Let's find the edge today." />
            <p className="text-[11px] text-[#8b94a8] mt-1">Shown at the top of your Journal page each day.</p>
          </Row>
          <Row label="Default Mood">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1} max={5}
                value={p.defaultMood}
                onChange={(e) => save({ defaultMood: +e.target.value as UserProfile["defaultMood"] })}
                className="w-48 accent-indigo-500"
              />
              <span className="text-xl">{["", "😫", "😟", "😐", "🙂", "🤩"][p.defaultMood]}</span>
              <span className="text-sm text-[#8b94a8]">{["", "Awful", "Bad", "Neutral", "Good", "Great"][p.defaultMood]}</span>
            </div>
          </Row>
          <Row label="Journal Prompts">
            <textarea
              className="textarea font-mono text-xs"
              rows={6}
              value={promptDraft}
              onChange={(e) => setPromptDraft(e.target.value)}
              onBlur={() => save({ journalPrompts: promptDraft.split("\n").map(s => s.trim()).filter(Boolean) })}
              placeholder={"One prompt per line:\nWhat is my plan for today?\nDid I follow my rules?"}
            />
            <p className="text-[11px] text-[#8b94a8] mt-1">One prompt per line. Shown as inspiration when writing a journal entry.</p>
          </Row>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={p.showLessonsField}
                onChange={(e) => save({ showLessonsField: e.target.checked })}
                className="accent-indigo-500 w-4 h-4"
              />
              <span className="text-sm">Show "Lessons" field</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={p.showMarketContextField}
                onChange={(e) => save({ showMarketContextField: e.target.checked })}
                className="accent-indigo-500 w-4 h-4"
              />
              <span className="text-sm">Show "Market Context" field</span>
            </label>
          </div>
        </div>
      </Section>

      {/* ===== APPEARANCE ===== */}
      <Section icon={Palette} title="Appearance" subtitle="Theme & display preferences" accent="bg-pink-500/15 text-pink-300">
        <div className="space-y-3">
          <Row label="Accent Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-10 rounded-lg border border-[#1f2a3d] bg-[#0f1626] cursor-pointer"
                value={p.accentColor}
                onChange={(e) => save({ accentColor: e.target.value })}
              />
              <span className="text-sm text-[#8b94a8]">{p.accentColor}</span>
              <button className="btn btn-ghost text-xs" onClick={() => save({ accentColor: "#6366f1" })}>Reset</button>
            </div>
          </Row>
          <Row label="Date Format">
            <select className="select" value={p.dateFormat} onChange={(e) => save({ dateFormat: e.target.value as UserProfile["dateFormat"] })}>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
            </select>
          </Row>
          <Row label="Currency">
            <select className="select !w-40" value={p.currency} onChange={(e) => save({ currency: e.target.value })}>
              {["USD","EUR","GBP","JPY","CAD","AUD","CHF","NZD","SGD","HKD","INR","ILS","ZAR","BRL","MXN","SEK","NOK","DKK","PLN","TRY","KRW","THB","CNY","AED","SAR"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Row>
        </div>
      </Section>

      {/* ===== ACCOUNTS ===== */}
      <Section icon={Sparkles} title="Trading Accounts" subtitle="Manage your brokerage accounts" accent="bg-sky-500/15 text-sky-300">
        <div className="space-y-2">
          {state.accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-white/[0.03] rounded-lg p-3 border border-[#1f2a3d]">
              <div>
                <div className="font-medium">{a.name}</div>
                <div className="text-xs text-[#8b94a8]">{a.broker} · Starting ${a.startingBalance.toLocaleString()} {a.currency}</div>
              </div>
              {state.accounts.length > 1 && (
                <button className="btn btn-danger" onClick={() => {
                  if (!confirm(`Delete account ${a.name} and all its trades?`)) return;
                  setState((s) => ({
                    ...s,
                    accounts: s.accounts.filter((x) => x.id !== a.id),
                    trades: s.trades.filter((t) => t.account !== a.id),
                    activeAccount: s.activeAccount === a.id ? s.accounts.find((x) => x.id !== a.id)!.id : s.activeAccount,
                  }));
                }}><Trash2 size={14} /> Remove</button>
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-primary mt-3" onClick={() => setOpen(true)}><Plus size={15} /> Add Account</button>
      </Section>

      {/* ===== DATA MANAGEMENT ===== */}
      <Section icon={Database} title="Data Management" subtitle="Backup, restore, and reset your data" accent="bg-orange-500/15 text-orange-300">
        <p className="text-sm text-[#8b94a8] mb-3">All your data is stored locally in your browser. Back up regularly.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={exportJSON}><Download size={14} /> Export JSON Backup</button>
          <button className="btn btn-ghost" onClick={exportEncrypted}><Shield size={14} /> Export Encrypted Backup</button>
          <label className="btn btn-ghost cursor-pointer">
            <Upload size={14} /> Import JSON Backup
            <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importJSON(f); }} />
          </label>
          <label className="btn btn-ghost cursor-pointer">
            <Upload size={14} /> Import Encrypted Backup
            <input type="file" accept="application/json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importEncrypted(f); }} />
          </label>
          <button className="btn btn-ghost" onClick={() => { if (confirm("Reset to demo data? This will replace all your data.")) resetAll(); }}>
            Reset to Demo Data
          </button>
          <button className="btn btn-danger" onClick={() => { if (confirm("DELETE ALL trades and journal entries?")) clearAll(); }}>
            <Trash2 size={14} /> Clear All Data
          </button>
        </div>
      </Section>

      {/* ===== ABOUT ===== */}
      <div className="card p-5">
        <h3 className="font-semibold mb-2">About YishaiEdge</h3>
        <p className="text-sm text-[#a3acc0]">
          YishaiEdge is a focused, no-fluff trading journal that goes beyond Tradezella with built-in AI insights,
          mental-state tracking, multi-account support, playbook checklists, and powerful position-sizing tools.
        </p>
        <p className="text-xs text-[#8b94a8] mt-2 flex items-center gap-1">
          <Clock size={11} /> v1.0 — Built with React + Recharts. All data is local-first.
        </p>
      </div>

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 fade-in px-4 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-100 flex items-center gap-2 text-sm shadow-2xl">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      {/* ADD ACCOUNT MODAL */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Account">
        <form onSubmit={(e) => { e.preventDefault(); addAccount(acct); setOpen(false); setAcct({ name: "", startingBalance: 10000, broker: "", currency: "USD" }); }} className="space-y-3">
          <div><label className="label">Name</label><input className="input" required value={acct.name} onChange={(e) => setAcct({ ...acct, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Starting Balance</label><input type="number" className="input" value={acct.startingBalance} onChange={(e) => setAcct({ ...acct, startingBalance: +e.target.value })} /></div>
            <div><label className="label">Currency</label><input className="input" value={acct.currency} onChange={(e) => setAcct({ ...acct, currency: e.target.value })} /></div>
          </div>
          <div><label className="label">Broker</label><input className="input" value={acct.broker} onChange={(e) => setAcct({ ...acct, broker: e.target.value })} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Account</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
