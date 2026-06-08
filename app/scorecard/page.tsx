'use client';

import { ColorType, createChart, LineSeries } from 'lightweight-charts';
import { useCallback, useEffect, useRef, useState } from 'react';

type PerformanceData = {
  metrics: {
    totalReturn: number;
    totalTrades: number;
    buyCount: number;
    sellCount: number;
    maxDrawdown: number;
    winRate: number;
  };
  daily: Array<{
    date: string;
    portfolioValue: number;
    dailyPnlPercent: number;
    cumulativePnlPercent: number;
    benchmarkSp500: number | null;
    benchmarkBtc: number | null;
  }>;
};

export default function ScorecardPage(): React.ReactElement {
  const [data, setData] = useState<PerformanceData | null>(null);
  const chartInstance = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    fetch('/api/performance')
      .then((r) => r.json())
      .then(setData);
  }, []);

  const initChart = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !data || data.daily.length === 0) return;

      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      const chart = createChart(node, {
        layout: { background: { type: ColorType.Solid, color: '#1e2235' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#2d3348' }, horzLines: { color: '#2d3348' } },
        width: node.clientWidth,
        height: 300,
      });

      const portfolioSeries = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 2 });
      portfolioSeries.setData(
        data.daily.map((d) => ({ time: d.date, value: d.portfolioValue })) as Parameters<
          typeof portfolioSeries.setData
        >[0],
      );

      if (data.daily.some((d) => d.benchmarkSp500 !== null)) {
        const sp500Series = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1 });
        sp500Series.setData(
          data.daily
            .filter((d) => d.benchmarkSp500 !== null)
            .map((d) => ({
              time: d.date,
              value: 10000 * (1 + (d.benchmarkSp500 as number) / 100),
            })) as Parameters<typeof sp500Series.setData>[0],
        );
      }

      chart.timeScale().fitContent();
      chartInstance.current = chart;

      const resize = (): void => {
        chart.applyOptions({ width: node.clientWidth });
      };
      window.addEventListener('resize', resize);
      return () => window.removeEventListener('resize', resize);
    },
    [data],
  );

  if (!data) return <div className="text-[var(--text-secondary)]">Loading...</div>;

  const { metrics } = data;

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric
          label="Total Return"
          value={`${metrics.totalReturn >= 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%`}
          color={metrics.totalReturn >= 0 ? 'green' : 'red'}
        />
        <Metric label="Total Trades" value={String(metrics.totalTrades)} />
        <Metric label="Buys / Sells" value={`${metrics.buyCount} / ${metrics.sellCount}`} />
        <Metric label="Win Rate" value={`${metrics.winRate.toFixed(0)}%`} />
        <Metric label="Max Drawdown" value={`-${metrics.maxDrawdown.toFixed(2)}%`} color="red" />
        <Metric label="Status" value={metrics.totalTrades > 0 ? 'Active' : 'Waiting'} />
      </div>

      {/* Performance Chart */}
      {data.daily.length > 0 ? (
        <div>
          <h2 className="mb-2 text-sm font-medium text-[var(--text-secondary)]">
            Portfolio Value Over Time
          </h2>
          <div ref={initChart} className="rounded border border-[var(--border)]" />
        </div>
      ) : (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center text-[var(--text-secondary)]">
          No performance data yet — waiting for first trading day 🐒
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: 'green' | 'red';
}): React.ReactElement {
  const colorClass =
    color === 'green'
      ? 'text-[var(--accent-green)]'
      : color === 'red'
        ? 'text-[var(--accent-red)]'
        : '';
  return (
    <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-3">
      <div className="text-xs text-[var(--text-secondary)]">{label}</div>
      <div className={`mt-1 text-lg font-bold ${colorClass}`}>{value}</div>
    </div>
  );
}
