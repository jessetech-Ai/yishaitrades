import { X, Keyboard } from "lucide-react";

const shortcuts = [
  { keys: ["Ctrl", "N"], desc: "New trade" },
  { keys: ["Ctrl", "F"], desc: "Focus search (trades page)" },
  { keys: ["Ctrl", "E"], desc: "Export CSV" },
  { keys: ["Esc"], desc: "Close any modal/overlay" },
  { keys: ["?"], desc: "Toggle this help" },
  { keys: ["1–9"], desc: "Quick navigate (1=Dashboard, 2=Trades…)" },
];

export const HelpOverlay = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card w-full max-w-md fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2a3d]">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-indigo-300" />
            <h3 className="font-semibold text-base">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-[#8b94a8] hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#cbd1de]">{s.desc}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded-md bg-white/5 border border-[#1f2a3d] text-xs text-[#a3acc0] font-mono min-w-[28px] text-center"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 pt-3 border-t border-[#1f2a3d] text-xs text-[#8b94a8]">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-[#1f2a3d] font-mono">?</kbd> anywhere to toggle this overlay.
          </div>
        </div>
      </div>
    </div>
  );
};
