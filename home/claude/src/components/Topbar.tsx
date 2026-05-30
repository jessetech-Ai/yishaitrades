import {
  Plus, Upload, Download, RotateCcw, Activity, Plug, FileText, Share2, Menu,
  AlertTriangle, XOctagon, BarChart3,
} from "lucide-react";
import type { Account } from "../lib/types";
import { fmtCurrency } from "../lib/calc";

export const Topbar = ({
  title, subtitle, onNewTrade, onImport, onExport, onExportPDF, onShare, onReset,
  accounts, activeAccount, setActiveAccount,
  syncing = false, enabledConnections = 0, onSyncClick, onMenuClick,
  dailyLimitHit = false, dailyLimitWarn = false, todayPnl = 0,
  todayTradeCount = 0, maxDailyTrades = 0,
}: {
  title: string;
  subtitle?: string;
  onNewTrade: () => void;
  onImport: () => void;
  onExport: () => void;
  onExportPDF?: () => void;
  onShare?: () => void;
  onReset: () => void;
  accounts: Account[];
  activeAccount: string;
  setActiveAccount: (id: string) => void;
  syncing?: boolean;
  enabledConnections?: number;
  onSyncClick?: () => void;
  onMenuClick?: () => void;
  dailyLimitHit?: boolean;
  dailyLimitWarn?: boolean;
  todayPnl?: number;
  todayTradeCount?: number;
  maxDailyTrades?: number;
}) => {
  return (
    <header className={`sticky top-0 z-30 backdrop-blur-md border-b ${dailyLimitHit ? "bg-rose-950/70 border-rose-700/50" : "bg-[#0a0e1a]/70 border-[#1f2a3d]"}`}>
      <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-3">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-lg hover:bg-white/5 text-[#a3acc0]" onClick={onMenuClick}>
          <Menu size={20} />
        </button>

        <div className="min-w-0 mr-auto">
          <h1 className="text-base md:text-lg font-semibold tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-[#8b94a8] truncate hidden md:block">{subtitle}</p>}
        </div>

        {/* Today's status strip */}
        <div className="hidden lg:flex items-center gap-2">
          {todayPnl !== 0 && (
            <div className={`chip border text-xs px-2 py-1 ${todayPnl >= 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-rose-500/10 border-rose-500/30 text-rose-300"}`}>
              <BarChart3 size={11} />
              Today: {fmtCurrency(todayPnl)}
            </div>
          )}
          {todayTradeCount > 0 && maxDailyTrades > 0 && (
            <div className={`chip border text-xs px-2 py-1 ${todayTradeCount >= maxDailyTrades ? "bg-rose-500/10 border-rose-500/30 text-rose-300" : "bg-white/5 border-[#1f2a3d] text-[#a3acc0]"}`}>
              {todayTradeCount}/{maxDailyTrades} trades
            </div>
          )}
          {dailyLimitWarn && (
            <div className="chip bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-2 py-1">
              <AlertTriangle size={11} /> Near limit
            </div>
          )}
          {dailyLimitHit && (
            <div className="chip bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs px-2 py-1 font-semibold">
              <XOctagon size={11} /> LIMIT HIT
            </div>
          )}
        </div>

        {/* Connection status */}
        {enabledConnections > 0 && (
          <button
            onClick={onSyncClick}
            className={`chip cursor-pointer border hidden md:inline-flex ${syncing
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
              : "bg-white/5 border-[#1f2a3d] text-[#a3acc0] hover:text-white"}`}
            title={syncing ? "Syncing…" : `${enabledConnections} active connection${enabledConnections > 1 ? "s" : ""}`}
          >
            {syncing ? <Activity size={12} className="animate-pulse" /> : <Plug size={12} />}
            <span>{syncing ? "Syncing" : `${enabledConnections} live`}</span>
          </button>
        )}

        {/* Account selector */}
        <select
          value={activeAccount}
          onChange={(e) => setActiveAccount(e.target.value)}
          className="select !py-2 !w-auto hidden md:block"
          title="Active account"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onImport} title="Import CSV"><Upload size={15} /></button>
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onExport} title="Export CSV"><Download size={15} /></button>
          {onExportPDF && <button className="btn btn-ghost hidden lg:inline-flex" onClick={onExportPDF} title="Export PDF Report"><FileText size={15} /></button>}
          {onShare && <button className="btn btn-ghost hidden lg:inline-flex" onClick={onShare} title="Share Summary"><Share2 size={15} /></button>}
          <button className="btn btn-ghost hidden md:inline-flex" onClick={onReset} title="Reset to sample data"><RotateCcw size={15} /></button>
          <button
            className={`btn ${dailyLimitHit ? "bg-rose-500/20 border-rose-500/30 text-rose-300 cursor-not-allowed" : "btn-primary"}`}
            onClick={onNewTrade}
            disabled={dailyLimitHit}
          >
            <Plus size={15} />
            <span className="hidden md:inline">New Trade</span>
          </button>
        </div>
      </div>
    </header>
  );
};
