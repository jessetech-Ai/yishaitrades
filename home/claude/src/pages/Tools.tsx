import { useState } from "react";
import { Calculator, Target, Percent, DollarSign } from "lucide-react";

export const Tools = () => {
  // Position sizer
  const [acctSize, setAcctSize] = useState(25000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(100);
  const [stop, setStop] = useState(98);

  const riskDollar = (acctSize * riskPct) / 100;
  const perShareRisk = Math.abs(entry - stop);
  const shares = perShareRisk ? Math.floor(riskDollar / perShareRisk) : 0;
  const positionSize = shares * entry;

  // R Multiple calculator
  const [rEntry, setREntry] = useState(100);
  const [rStop, setRStop] = useState(98);
  const [rTarget, setRTarget] = useState(106);
  const rR = Math.abs(rTarget - rEntry) / Math.abs(rEntry - rStop);

  // Expectancy calculator
  const [winRate, setWinRate] = useState(50);
  const [avgWin, setAvgWin] = useState(150);
  const [avgLoss, setAvgLoss] = useState(100);
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss;

  // Break-even win rate
  const beWinRate = (avgLoss / (avgWin + avgLoss)) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center"><Calculator size={16} /></div>
          <div>
            <h3 className="font-semibold">Position Size Calculator</h3>
            <p className="text-xs text-[#8b94a8]">Risk-based sizing</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Account Size ($)</label><input type="number" className="input" value={acctSize} onChange={(e) => setAcctSize(+e.target.value)} /></div>
          <div><label className="label">Risk % per Trade</label><input type="number" step="0.1" className="input" value={riskPct} onChange={(e) => setRiskPct(+e.target.value)} /></div>
          <div><label className="label">Entry Price</label><input type="number" step="any" className="input" value={entry} onChange={(e) => setEntry(+e.target.value)} /></div>
          <div><label className="label">Stop Loss</label><input type="number" step="any" className="input" value={stop} onChange={(e) => setStop(+e.target.value)} /></div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/[0.03] rounded-lg p-3 border border-[#1f2a3d]">
            <div className="text-[10px] uppercase text-[#8b94a8]">Dollar Risk</div>
            <div className="text-xl font-semibold text-amber-400">${riskDollar.toFixed(2)}</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3 border border-[#1f2a3d]">
            <div className="text-[10px] uppercase text-[#8b94a8]">Shares</div>
            <div className="text-xl font-semibold text-indigo-300">{shares.toLocaleString()}</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg p-3 border border-[#1f2a3d]">
            <div className="text-[10px] uppercase text-[#8b94a8]">Position</div>
            <div className="text-xl font-semibold">${positionSize.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-violet-500/15 text-violet-300 flex items-center justify-center"><Target size={16} /></div>
          <div>
            <h3 className="font-semibold">R Multiple Calculator</h3>
            <p className="text-xs text-[#8b94a8]">Risk:Reward ratio</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Entry</label><input type="number" step="any" className="input" value={rEntry} onChange={(e) => setREntry(+e.target.value)} /></div>
          <div><label className="label">Stop</label><input type="number" step="any" className="input" value={rStop} onChange={(e) => setRStop(+e.target.value)} /></div>
          <div><label className="label">Target</label><input type="number" step="any" className="input" value={rTarget} onChange={(e) => setRTarget(+e.target.value)} /></div>
        </div>
        <div className="mt-4 bg-white/[0.03] rounded-lg p-4 border border-[#1f2a3d] text-center">
          <div className="text-[10px] uppercase text-[#8b94a8]">Risk : Reward</div>
          <div className={`text-3xl font-semibold mt-1 ${rR >= 2 ? "text-emerald-400" : rR >= 1 ? "text-amber-400" : "text-rose-400"}`}>
            1 : {rR.toFixed(2)}
          </div>
          <div className="text-xs text-[#8b94a8] mt-2">
            {rR >= 3 ? "Excellent — A+ trade." : rR >= 2 ? "Good R:R, take it." : rR >= 1 ? "Marginal — needs >50% win rate." : "Poor R:R — pass or refine."}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><DollarSign size={16} /></div>
          <div>
            <h3 className="font-semibold">Expectancy Calculator</h3>
            <p className="text-xs text-[#8b94a8]">Average $ per trade over time</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="label">Win Rate %</label><input type="number" className="input" value={winRate} onChange={(e) => setWinRate(+e.target.value)} /></div>
          <div><label className="label">Avg Win $</label><input type="number" className="input" value={avgWin} onChange={(e) => setAvgWin(+e.target.value)} /></div>
          <div><label className="label">Avg Loss $</label><input type="number" className="input" value={avgLoss} onChange={(e) => setAvgLoss(+e.target.value)} /></div>
        </div>
        <div className="mt-4 bg-white/[0.03] rounded-lg p-4 border border-[#1f2a3d] text-center">
          <div className="text-[10px] uppercase text-[#8b94a8]">Expectancy per trade</div>
          <div className={`text-3xl font-semibold mt-1 ${expectancy > 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {expectancy >= 0 ? "+" : ""}${expectancy.toFixed(2)}
          </div>
          <div className="text-xs text-[#8b94a8] mt-2">{expectancy > 0 ? "Profitable system — trade with conviction." : "Negative edge — refine strategy or skip."}</div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center"><Percent size={16} /></div>
          <div>
            <h3 className="font-semibold">Break-even Win Rate</h3>
            <p className="text-xs text-[#8b94a8]">Min win rate to be profitable at current avg W/L</p>
          </div>
        </div>
        <div className="mt-2 bg-white/[0.03] rounded-lg p-4 border border-[#1f2a3d] text-center">
          <div className="text-[10px] uppercase text-[#8b94a8]">Required Win Rate</div>
          <div className="text-3xl font-semibold mt-1 text-amber-400">{beWinRate.toFixed(1)}%</div>
          <div className="text-xs text-[#8b94a8] mt-2">
            Based on avg win ${avgWin} and avg loss ${avgLoss}. You're currently at {winRate}% — that's {winRate > beWinRate ? "above" : "below"} break-even.
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs text-[#cbd1de]">
          <span className="font-semibold text-indigo-300">Tip:</span> Increasing your avg R:R is more powerful than increasing your win rate. A 40% win rate at 3R is better than 60% at 1R.
        </div>
      </div>
    </div>
  );
};
