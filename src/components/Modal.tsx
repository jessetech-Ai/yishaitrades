import { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({
  open, onClose, title, children, maxWidth = "max-w-2xl",
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string;
}) => {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onEsc); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`card w-full ${maxWidth} fade-in`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2a3d]">
          <h3 className="font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-[#8b94a8] hover:text-white"><X size={18} /></button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
