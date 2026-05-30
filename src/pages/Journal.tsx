import { useState } from "react";
import type { JournalEntry, UserProfile } from "../lib/types";
import { Modal } from "../components/Modal";
import { Plus, Pencil, Trash2, Smile, Frown, Meh, Lightbulb, Sparkles } from "lucide-react";

const moodIcon = (m: number) => m >= 4 ? <Smile size={16} className="text-emerald-400" /> : m <= 2 ? <Frown size={16} className="text-rose-400" /> : <Meh size={16} className="text-amber-400" />;
const moodEmoji = (m: number) => ["", "😫", "😟", "😐", "🙂", "🤩"][m];
const moodLabel = (m: number) => ["", "Awful", "Bad", "Neutral", "Good", "Great"][m];

const today = () => new Date().toISOString().slice(0, 10);

const JournalForm = ({
  initial, onCancel, onSubmit, profile,
}: {
  initial?: JournalEntry;
  onCancel: () => void;
  onSubmit: (j: Omit<JournalEntry, "id">) => void;
  profile: UserProfile;
}) => {
  const [form, setForm] = useState<Omit<JournalEntry, "id">>(initial ?? {
    date: today(), title: "", content: "", mood: profile.defaultMood, lessons: "", marketContext: "",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div><label className="label">Mood {moodEmoji(form.mood)} {moodLabel(form.mood)}</label>
          <input type="range" min={1} max={5} value={form.mood} onChange={(e) => setForm({ ...form, mood: +e.target.value as JournalEntry["mood"] })} className="w-full accent-indigo-500 mt-2" />
        </div>
      </div>
      <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Disciplined session" /></div>

      {/* Prompts */}
      {profile.journalPrompts.length > 0 && !form.content && (
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
          <div className="text-[10px] uppercase tracking-wider text-indigo-300 mb-1.5 font-semibold flex items-center gap-1"><Lightbulb size={11} /> Prompts to guide you</div>
          <ul className="space-y-1 text-xs text-[#cbd1de]">
            {profile.journalPrompts.map((pr, i) => (
              <li
                key={i}
                className="cursor-pointer hover:text-indigo-300 transition-colors"
                onClick={() => setForm({ ...form, content: form.content + (form.content ? "\n\n" : "") + pr + "\n" })}
              >
                • {pr}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div><label className="label">Journal Entry</label><textarea className="textarea" rows={5} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="How did the session go? What did you feel?" /></div>

      {profile.showLessonsField && (
        <div><label className="label">Lessons Learned</label><textarea className="textarea" rows={2} value={form.lessons} onChange={(e) => setForm({ ...form, lessons: e.target.value })} placeholder="What will you do differently?" /></div>
      )}
      {profile.showMarketContextField && (
        <div><label className="label">Market Context</label><input className="input" value={form.marketContext} onChange={(e) => setForm({ ...form, marketContext: e.target.value })} placeholder="SPY trending up, low vol, FOMC at 2pm" /></div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? "Save" : "Add Entry"}</button>
      </div>
    </form>
  );
};

export const Journal = ({
  entries, addJournal, updateJournal, deleteJournal, profile,
}: {
  entries: JournalEntry[];
  addJournal: (j: Omit<JournalEntry, "id">) => void;
  updateJournal: (id: string, p: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;
  profile: UserProfile;
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  // Time-aware greeting
  const hour = new Date().getHours();
  const timeGreet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = profile.displayName || "Trader";

  return (
    <div className="space-y-4">
      {/* Personalized header */}
      <div className="card p-5 bg-gradient-to-br from-emerald-500/10 via-indigo-500/5 to-transparent border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-2xl shadow-lg">
            {moodEmoji(profile.defaultMood)}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{timeGreet}, {displayName}.</h2>
            <p className="text-sm text-[#a3acc0]">
              {profile.journalGreeting || "Your trading psychology log — the inner game."}
            </p>
          </div>
          <button className="btn btn-primary ml-auto" onClick={() => setOpen(true)}><Plus size={15} /> New Entry</button>
        </div>
      </div>

      {/* Stats strip */}
      {entries.length > 0 && (
        <div className="flex gap-3">
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <Sparkles size={13} className="text-indigo-300" />
            <span className="text-xs text-[#8b94a8]">Entries</span>
            <span className="font-semibold">{entries.length}</span>
          </div>
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-[#8b94a8]">Streak</span>
            <span className="font-semibold text-emerald-400">
              {(() => {
                const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
                let streak = 0;
                const d = new Date();
                for (let i = 0; i < 365; i++) {
                  const ds = d.toISOString().slice(0, 10);
                  if (dates.includes(ds)) streak++;
                  else if (i > 0) break;
                  d.setDate(d.getDate() - 1);
                }
                return streak;
              })()}d
            </span>
          </div>
          <div className="card px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-[#8b94a8]">Avg Mood</span>
            <span className="font-semibold">
              {moodEmoji(Math.round(entries.reduce((s, e) => s + e.mood, 0) / entries.length))}
              {" "}
              {(entries.reduce((s, e) => s + e.mood, 0) / entries.length).toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {sorted.length === 0 && (
        <div className="card p-10 text-center text-[#8b94a8]">
          <div className="text-3xl mb-2">📝</div>
          No journal entries yet. Build the daily habit — every edge starts with self-awareness.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((j) => (
          <div key={j.id} className="card card-hover p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="text-xs text-[#8b94a8] uppercase tracking-wider">{new Date(j.date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>
                <h3 className="font-semibold text-base">{j.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="chip bg-white/5 border border-[#1f2a3d]">{moodIcon(j.mood)} {moodLabel(j.mood)}</span>
                <button className="p-1.5 rounded hover:bg-white/5 text-[#8b94a8]" onClick={() => setEditing(j)}><Pencil size={14} /></button>
                <button className="p-1.5 rounded hover:bg-rose-500/10 text-[#8b94a8] hover:text-rose-400" onClick={() => { if (confirm("Delete entry?")) deleteJournal(j.id); }}><Trash2 size={14} /></button>
              </div>
            </div>
            <p className="text-sm text-[#cbd1de] whitespace-pre-wrap">{j.content}</p>
            {j.lessons && (
              <div className="mt-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-indigo-300 mb-1 font-semibold">Lessons</div>
                <div className="text-sm">{j.lessons}</div>
              </div>
            )}
            {j.marketContext && (
              <div className="mt-2 text-xs text-[#8b94a8]"><span className="text-[#a3acc0]">Market:</span> {j.marketContext}</div>
            )}
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Journal Entry">
        <JournalForm profile={profile} onCancel={() => setOpen(false)} onSubmit={(j) => { addJournal(j); setOpen(false); }} />
      </Modal>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit Entry">
        {editing && <JournalForm profile={profile} initial={editing} onCancel={() => setEditing(null)} onSubmit={(j) => { updateJournal(editing.id, j); setEditing(null); }} />}
      </Modal>
    </div>
  );
};
