'use client';

import { useEffect, useState } from 'react';

type PortfolioData = {
  cash: number;
  totalValue: number;
  dailyPnl: number;
  dailyPnlPercent: number;
  winRate: number;
  investedPercent: number;
  isDefensiveMode: boolean;
  positions: Array<{
    ticker: string;
    shares: number;
    avgEntryPrice: number;
    currentPrice: number;
    pnlPercent: number;
    weightPercent: number;
  }>;
};

export default function PortfolioPage(): React.ReactElement {
  const [data, setData] = useState<PortfolioData | null>(null);

  useEffect(() => {
    fetch('/api/portfolio')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  return (
    <div className="space-y-6">
      {data.isDefensiveMode && (
        <div className="rounded bg-[var(--accent-red)]/20 border border-[var(--accent-red)] px-4 py-2 text-sm">
          ⚠️ Defensive Mode Active — Portfolio down &gt;10% this week
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card label="Portfolio Value" value={`$${data.totalValue.toLocaleString()}`} />
        <Card label="Cash" value={`$${data.cash.toLocaleString()}`} />
        <Card
          label="P&L"
          value={`${data.dailyPnl >= 0 ? '+' : ''}$${data.dailyPnl.toFixed(0)}`}
          sub={`${data.dailyPnlPercent >= 0 ? '+' : ''}${data.dailyPnlPercent.toFixed(2)}%`}
          color={data.dailyPnl >= 0 ? 'green' : 'red'}
        />
        <Card label="Win Rate" value={`${data.winRate.toFixed(0)}%`} />
      </div>

      {/* Positions Table */}
      {data.positions.length > 0 ? (
        <div className="overflow-x-auto rounded border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              <tr>
                <th className="px-3 py-2 text-left">Ticker</th>
                <th className="px-3 py-2 text-right">Shares</th>
                <th className="px-3 py-2 text-right">Entry</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">P&L %</th>
                <th className="px-3 py-2 text-right">Weight</th>
              </tr>
            </thead>
            <tbody>
              {data.positions.map((p) => (
                <tr key={p.ticker} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2 font-medium">{p.ticker}</td>
                  <td className="px-3 py-2 text-right">{p.shares.toFixed(4)}</td>
                  <td className="px-3 py-2 text-right">${p.avgEntryPrice.toFixed(2)}</td>
                  <td className="px-3 py-2 text-right">${p.currentPrice.toFixed(2)}</td>
                  <td
                    className={`px-3 py-2 text-right ${p.pnlPercent >= 0 ? 'text-[var(--accent-green)]' : 'text-[var(--accent-red)]'}`}
                  >
                    {p.pnlPercent >= 0 ? '+' : ''}
                    {p.pnlPercent.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right">{p.weightPercent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center text-[var(--text-secondary)]">
          No positions yet — waiting for first trade 🐒
        </div>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: 'green' | 'red';
}): React.ReactElement {
  const colorClass =
    color === 'green'
      ? 'text-[var(--accent-green)]'
      : color === 'red'
        ? 'text-[var(--accent-red)]'
        : '';
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-4">
      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-1 text-xl font-bold ${colorClass}`}>{value}</div>
      {sub && <div className={`text-xs ${colorClass}`}>{sub}</div>}
    </div>
  );
}
