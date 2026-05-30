import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Trade, Account, UserProfile } from "./types";
import { tradePnl, computeStats, groupBy, sum, fmtCurrency, fmtPct, equityCurve, drawdown } from "./calc";

export const generatePDF = (
  trades: Trade[],
  account: Account,
  profile: UserProfile,
  dateRange?: { from: string; to: string }
) => {
  const doc = new jsPDF();
  const stats = computeStats(trades);
  const curve = equityCurve(trades, account.startingBalance);
  const dd = drawdown(curve);
  const w = doc.internal.pageSize.getWidth();
  const margin = 14;

  const now = new Date();
  const rangeLabel = dateRange
    ? `${dateRange.from} to ${dateRange.to}`
    : `All Time (${trades.length > 0 ? trades[trades.length - 1]?.closeTime?.slice(0, 10) : "—"} → ${now.toISOString().slice(0, 10)})`;

  // ---- HEADER ----
  doc.setFillColor(17, 24, 38);
  doc.rect(0, 0, w, 42, "F");
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 4, 42, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("YishaiEdge", margin, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 200);
  doc.text("PERFORMANCE REPORT", margin, 23);

  doc.setFontSize(10);
  doc.setTextColor(220, 220, 240);
  doc.text(`${profile.displayName || "Trader"} · ${account.name}`, margin, 32);
  doc.setFontSize(8);
  doc.setTextColor(140, 150, 170);
  doc.text(`Period: ${rangeLabel}  |  Generated: ${now.toLocaleDateString()}`, margin, 38);

  let y = 52;

  // ---- KEY METRICS ----
  doc.setTextColor(99, 102, 241);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PERFORMANCE METRICS", margin, y);
  y += 2;

  const metricsData = [
    ["Total Trades", String(stats.trades)],
    ["Winning Trades", `${stats.wins} (${fmtPct(stats.winRate)})`],
    ["Losing Trades", `${stats.losses} (${fmtPct(stats.trades ? (stats.losses / stats.trades) * 100 : 0)})`],
    ["Breakeven", String(stats.breakeven)],
    ["", ""],
    ["Net P&L", fmtCurrency(stats.totalPnl, account.currency)],
    ["Profit Factor", isFinite(stats.profitFactor) ? stats.profitFactor.toFixed(2) + "x" : "∞"],
    ["Expectancy", fmtCurrency(stats.expectancy, account.currency) + " per trade"],
    ["Avg Win", fmtCurrency(stats.avgWin, account.currency)],
    ["Avg Loss", fmtCurrency(stats.avgLoss, account.currency)],
    ["Largest Win", fmtCurrency(stats.largestWin, account.currency)],
    ["Largest Loss", fmtCurrency(stats.largestLoss, account.currency)],
    ["", ""],
    ["Max Drawdown", `${fmtCurrency(dd.maxDD, account.currency)} (${fmtPct(dd.maxDDPct)})`],
    ["Avg R Multiple", `${stats.avgRR.toFixed(2)}R`],
    ["Best Win Streak", `${stats.bestStreak} trades`],
    ["Worst Loss Streak", `${stats.worstStreak} trades`],
    ["Total Fees Paid", fmtCurrency(stats.totalFees, account.currency)],
    ["Avg Hold Time", `${Math.round(stats.avgHoldMin)} min`],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: metricsData,
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 1.5, textColor: [50, 55, 65] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: [100, 110, 130] },
      1: { halign: "left", textColor: [30, 35, 45] },
    },
    didParseCell: (data) => {
      // Highlight P&L row
      if (data.row.index === 5 && data.column.index === 1) {
        data.cell.styles.textColor = stats.totalPnl >= 0 ? [16, 185, 129] : [244, 63, 94];
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ---- STRATEGY BREAKDOWN ----
  const bySetup = Object.entries(groupBy(trades, (t) => t.setup || "Untagged"))
    .map(([k, ts]) => {
      const pnls = ts.map(tradePnl);
      const wins = pnls.filter((p) => p > 0).length;
      return [
        k,
        String(ts.length),
        fmtPct(ts.length ? (wins / ts.length) * 100 : 0),
        fmtCurrency(sum(pnls), account.currency),
        ts.length ? (sum(pnls) / ts.length).toFixed(2) : "0.00",
      ];
    })
    .sort((a, b) => parseFloat(b[3].replace(/[^0-9.-]/g, "")) - parseFloat(a[3].replace(/[^0-9.-]/g, "")));

  if (bySetup.length > 0) {
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("STRATEGY BREAKDOWN", margin, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["Strategy", "Trades", "Win Rate", "P&L", "Avg P&L"]],
      body: bySetup,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [25, 32, 50], textColor: [180, 190, 210], fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // ---- TOP / BOTTOM TRADES ----
  const sorted = [...trades].sort((a, b) => tradePnl(b) - tradePnl(a));
  const topTrades = sorted.slice(0, 5);
  const bottomTrades = sorted.slice(-5).reverse();

  const tradeRow = (t: Trade) => [
    t.symbol,
    t.side.toUpperCase(),
    t.entry.toFixed(2),
    t.exit.toFixed(2),
    fmtCurrency(tradePnl(t), account.currency),
    t.setup || "—",
    new Date(t.closeTime).toLocaleDateString(),
  ];

  // Check if we need a new page
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setTextColor(16, 185, 129);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("TOP 5 WINNING TRADES", margin, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Symbol", "Side", "Entry", "Exit", "P&L", "Setup", "Date"]],
    body: topTrades.map(tradeRow),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [25, 32, 50], textColor: [180, 190, 210], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [240, 255, 248] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  if (y > 220) { doc.addPage(); y = 20; }

  doc.setTextColor(244, 63, 94);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BOTTOM 5 TRADES", margin, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Symbol", "Side", "Entry", "Exit", "P&L", "Setup", "Date"]],
    body: bottomTrades.map(tradeRow),
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [25, 32, 50], textColor: [180, 190, 210], fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    alternateRowStyles: { fillColor: [255, 240, 243] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  if (y > 220) { doc.addPage(); y = 20; }

  // ---- DAY OF WEEK BREAKDOWN ----
  const dows = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDow = dows.map((d, idx) => {
    const ts = trades.filter((t) => new Date(t.closeTime).getDay() === idx);
    const pnls = ts.map(tradePnl);
    const wins = pnls.filter((p) => p > 0).length;
    return [d, String(ts.length), fmtPct(ts.length ? (wins / ts.length) * 100 : 0), fmtCurrency(sum(pnls), account.currency)];
  }).filter((r) => parseInt(r[1]) > 0);

  doc.setTextColor(99, 102, 241);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PERFORMANCE BY DAY", margin, y);

  autoTable(doc, {
    startY: y + 3,
    head: [["Day", "Trades", "Win Rate", "P&L"]],
    body: byDow,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: [25, 32, 50], textColor: [180, 190, 210], fontSize: 8 },
    styles: { fontSize: 9, cellPadding: 2 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
  });

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  if (y > 240) { doc.addPage(); y = 20; }

  // ---- EMOTION ANALYSIS ----
  const byEmotion = Object.entries(groupBy(trades, (t) => t.emotion || "—"))
    .map(([k, ts]) => {
      const pnls = ts.map(tradePnl);
      const wins = pnls.filter((p) => p > 0).length;
      return [k, String(ts.length), fmtPct(ts.length ? (wins / ts.length) * 100 : 0), fmtCurrency(sum(pnls), account.currency)];
    });

  if (byEmotion.length > 1) {
    doc.setTextColor(139, 92, 246);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("EMOTION / MINDSET ANALYSIS", margin, y);

    autoTable(doc, {
      startY: y + 3,
      head: [["Emotion", "Trades", "Win Rate", "P&L"]],
      body: byEmotion,
      margin: { left: margin, right: margin },
      headStyles: { fillColor: [25, 32, 50], textColor: [180, 190, 210], fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 2 },
      alternateRowStyles: { fillColor: [248, 245, 255] },
    });
  }

  // ---- FOOTER ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 155, 165);
    doc.text(
      `Generated by YishaiEdge — Your edge, journaled.  |  Page ${i} of ${pageCount}`,
      w / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  // Save
  const dateSuffix = dateRange
    ? `${dateRange.from}_to_${dateRange.to}`
    : now.toISOString().slice(0, 10);
  doc.save(`yishaiedge-report-${dateSuffix}.pdf`);
};
