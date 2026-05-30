import { useMemo } from "react";
import type { Trade, Account } from "../lib/types";
import { tradePnl, fmtCurrency, fmtPct, groupBy, sum } from "../lib/calc";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell,
  PieChart, Pie, Legend, ScatterChart, Scatter, ZAxis,
} from "recharts";

const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="card p-4">
    <div className="mb-3">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-[#8b94a8]">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const aggBy = (trades: Trade[], key: (t: Trade) => string) => {
  const grouped = groupBy(trades, key);
  return Object.entries(grouped).map(([k, ts]) => {
    const pnls = ts.map(tradePnl);
    const wins = pnls.filter((p) => p > 0).length;
    return {
      key: k,
      pnl: sum(pnls),
      trades: ts.length,
      winRate: ts.length ? (wins / ts.length) * 100 : 0,
    };
  });
};

const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const Analytics = ({ trades, account }: { trades: Trade[]; account: Account }) => {
  const bySymbol = useMemo(() => aggBy(trades, (t) => t.symbol).sort((a, b) => b.pnl - a.pnl), [trades]);
  const bySetup = useMemo(() => aggBy(trades, (t) => t.setup || "Untagged").sort((a, b) => b.pnl - a.pnl), [trades]);
  const byDow = useMemo(() => {
    const data = aggBy(trades, (t) => dows[new Date(t.closeTime).getDay()]);
    return dows.map((d) => data.find((x) => x.key === d) || { key: d, pnl: 0, trades: 0, winRate: 0 });
  }, [trades]);
  const byHour = useMemo(() => {
    const grouped = groupBy(trades, (t) => new Date(t.openTime).getHours().toString());
    return Array.from({ length: 24 }, (_, h) => {
      const ts = grouped[h.toString()] || [];
      const pnls = ts.map(tradePnl);
      return { key: `${h}:00`, hour: h, pnl: sum(pnls), trades: ts.length };
    }).filter((d) => d.hour >= 6 && d.hour <= 20);
  }, [trades]);
  const byEmotion = useMemo(() => aggBy(trades, (t) => t.emotion || "—"), [trades]);
  const byRating = useMemo(() => {
    const grouped = groupBy(trades, (t) => t.rating.toString());
    return [1, 2, 3, 4, 5].map((r) => {
      const ts = grouped[r.toString()] || [];
      const pnls = ts.map(tradePnl);
      return { rating: `${r}★`, pnl: sum(pnls), trades: ts.length, avg: ts.length ? sum(pnls) / ts.length : 0 };
    });
  }, [trades]);
  const scatter = useMemo(() => trades.map((t) => {
    const hold = (new Date(t.closeTime).getTime() - new Date(t.openTime).getTime()) / 60000;
    return { hold, pnl: tradePnl(t), symbol: t.symbol };
  }), [trades]);
  const longShort = useMemo(() => {
    const longs = trades.filter((t) => t.side === "long");
    const shorts = trades.filter((t) => t.side === "short");
    return [
      { name: "Long", value: sum(longs.map(tradePnl)), trades: longs.length, color: "#10b981" },
      { name: "Short", value: sum(shorts.map(tradePnl)), trades: shorts.length, color: "#f43f5e" },
    ];
  }, [trades]);

  const tooltipStyle = { background: "#0f1626", border: "1px solid #1f2a3d", borderRadius: 10, color: "#e5e7eb" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Section title="P&L by Symbol" subtitle="Where you make and lose money">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={bySymbol} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke="#1f2a3d" horizontal={false} />
              <XAxis type="number" stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="key" stroke="#8b94a8" fontSize={11} width={60} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
              <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                {bySymbol.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="P&L by Setup" subtitle="Which playbooks are working">
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={bySetup}>
              <CartesianGrid stroke="#1f2a3d" vertical={false} />
              <XAxis dataKey="key" stroke="#8b94a8" fontSize={10} angle={-20} textAnchor="end" height={50} />
              <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {bySetup.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#6366f1" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {bySetup.map((s) => (
            <div key={s.key} className="bg-white/[0.03] rounded-lg p-2 border border-[#1f2a3d]">
              <div className="text-[#a3acc0] truncate">{s.key}</div>
              <div className={s.pnl >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>{fmtCurrency(s.pnl, account.currency)}</div>
              <div className="text-[#8b94a8]">{s.trades} trades · {fmtPct(s.winRate)}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Performance by Day of Week" subtitle="Are you better on certain days?">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byDow}>
              <CartesianGrid stroke="#1f2a3d" vertical={false} />
              <XAxis dataKey="key" stroke="#8b94a8" fontSize={11} />
              <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {byDow.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Performance by Hour" subtitle="Best time to trade">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byHour}>
              <CartesianGrid stroke="#1f2a3d" vertical={false} />
              <XAxis dataKey="key" stroke="#8b94a8" fontSize={10} />
              <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {byHour.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#8b5cf6" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Long vs Short" subtitle="Bias check">
        <div className="h-64 flex items-center">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={longShort} dataKey="trades" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {longShort.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, _n, p) => [`${v} trades · ${fmtCurrency(p.payload.value, account.currency)}`, p.payload.name]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Discipline Rating Impact" subtitle="Does discipline correlate with P&L?">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byRating}>
              <CartesianGrid stroke="#1f2a3d" vertical={false} />
              <XAxis dataKey="rating" stroke="#8b94a8" fontSize={11} />
              <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
              <Bar dataKey="avg" radius={[4, 4, 0, 0]} name="Avg P&L">
                {byRating.map((d, i) => <Cell key={i} fill={d.avg >= 0 ? "#10b981" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Hold Time vs P&L" subtitle="Are quick exits or held positions better?">
        <div className="h-64">
          <ResponsiveContainer>
            <ScatterChart>
              <CartesianGrid stroke="#1f2a3d" />
              <XAxis type="number" dataKey="hold" name="Hold (min)" stroke="#8b94a8" fontSize={10} unit="m" />
              <YAxis type="number" dataKey="pnl" name="P&L" stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <ZAxis range={[60, 60]} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [n === "pnl" ? fmtCurrency(Number(v), account.currency) as string : `${Math.round(Number(v))}m`, n === "pnl" ? "P&L" : "Hold"]} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={scatter}>
                {scatter.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#10b981" : "#f43f5e"} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="P&L by Emotion" subtitle="The mental edge">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byEmotion}>
              <CartesianGrid stroke="#1f2a3d" vertical={false} />
              <XAxis dataKey="key" stroke="#8b94a8" fontSize={11} />
              <YAxis stroke="#8b94a8" fontSize={10} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtCurrency(Number(v), account.currency) as string} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {byEmotion.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? "#8b5cf6" : "#f43f5e"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  );
};
