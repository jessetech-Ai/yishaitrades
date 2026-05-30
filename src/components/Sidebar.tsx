import {
  LayoutDashboard, BookOpen, ListChecks, NotebookPen, CalendarDays,
  TrendingUp, Target, Calculator, Settings, Sparkles, Zap, Plug, HelpCircle,
} from "lucide-react";

export type Page =
  | "dashboard" | "trades" | "analytics" | "calendar" | "journal"
  | "playbook" | "goals" | "insights" | "tools" | "connections" | "help" | "settings";

const items: { id: Page; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "trades", label: "Trade Log", icon: ListChecks },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "journal", label: "Journal", icon: NotebookPen },
  { id: "playbook", label: "Playbook", icon: BookOpen },
  { id: "goals", label: "Goals", icon: Target },
  { id: "insights", label: "AI Insights", icon: Sparkles },
  { id: "tools", label: "Tools", icon: Calculator },
  { id: "connections", label: "Connections", icon: Plug },
  { id: "help", label: "Help & Audit", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings },
];

export const Sidebar = ({
  page, setPage, profile,
}: {
  page: Page;
  setPage: (p: Page) => void;
  profile?: { displayName: string; firstName: string; lastName: string; avatar: string; email: string; tradingStyle: string };
}) => {
  const name = profile?.displayName || "Trader";
  const initials = profile?.firstName || profile?.lastName
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : null;
  const avatar = initials || profile?.avatar || "⚡";

  return (
    <aside className="w-60 shrink-0 border-r border-[#1f2a3d] bg-[#0c1220]/60 backdrop-blur-md h-screen sticky top-0 flex flex-col">
      <div className="px-5 py-5 border-b border-[#1f2a3d]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-[15px]">YishaiEdge</div>
            <div className="text-[10px] uppercase tracking-widest text-[#8b94a8]">Trade · Track · Master</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = page === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setPage(it.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                active
                  ? "bg-gradient-to-r from-indigo-500/20 to-violet-500/10 text-white border border-indigo-500/30"
                  : "text-[#a3acc0] hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Icon size={16} />
              <span>{it.label}</span>
              {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#1f2a3d]">
        <button
          onClick={() => setPage("settings")}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
            {avatar}
          </div>
          <div className="min-w-0 text-left">
            <div className="text-sm font-medium truncate group-hover:text-white">{name}</div>
            <div className="text-[10px] text-[#8b94a8] truncate capitalize">
              {profile?.tradingStyle?.replace("-", " ") || "Trader"}
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
};
