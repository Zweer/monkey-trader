'use client';

import { CandlestickSeries, ColorType, createChart, LineSeries } from 'lightweight-charts';
import { useCallback, useEffect, useRef, useState } from 'react';

type ChartData = {
  candles: Array<{ time: number; open: number; high: number; low: number; close: number }>;
  indicators: Array<{ time: number; ma20: number | null; ma50: number | null }>;
  markers: Array<{ time: number; position: string; color: string; shape: string; text: string }>;
};

const RANGES = ['7d', '30d', '90d', 'all'] as const;

export default function ChartsPage(): React.ReactElement {
  const [ticker, setTicker] = useState('BTC');
  const [range, setRange] = useState<string>('30d');
  const [data, setData] = useState<ChartData | null>(null);
  const chartInstance = useRef<ReturnType<typeof createChart> | null>(null);

  useEffect(() => {
    fetch(`/api/chart-data?ticker=${ticker}&range=${range}`)
      .then((r) => r.json())
      .then(setData);
  }, [ticker, range]);

  const initChart = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || !data || data.candles.length === 0) return;

      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }

      const chart = createChart(node, {
        layout: { background: { type: ColorType.Solid, color: '#1e2235' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#2d3348' }, horzLines: { color: '#2d3348' } },
        width: node.clientWidth,
        height: 400,
      });

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
      candleSeries.setData(data.candles as Parameters<typeof candleSeries.setData>[0]);

      // MA lines
      const ma20Data = data.indicators
        .filter((i) => i.ma20 !== null)
        .map((i) => ({ time: i.time, value: i.ma20 as number }));
      const ma50Data = data.indicators
        .filter((i) => i.ma50 !== null)
        .map((i) => ({ time: i.time, value: i.ma50 as number }));

      if (ma20Data.length > 0) {
        const ma20Series = chart.addSeries(LineSeries, { color: '#60a5fa', lineWidth: 1 });
        ma20Series.setData(ma20Data as Parameters<typeof ma20Series.setData>[0]);
      }
      if (ma50Data.length > 0) {
        const ma50Series = chart.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1 });
        ma50Series.setData(ma50Data as Parameters<typeof ma50Series.setData>[0]);
      }

      // Markers (logged decisions as visual indicators)
      // Note: v5 uses SeriesMarkersPrimitive — markers shown in tooltip only for now

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm w-24"
          aria-label="Ticker symbol"
        />
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRange(r)}
              className={`rounded px-3 py-1 text-xs ${range === r ? 'bg-[var(--bg-card)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {data && data.candles.length > 0 ? (
        <div ref={initChart} className="rounded border border-[var(--border)]" />
      ) : (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-6 py-24 text-center text-[var(--text-secondary)]">
          {data ? 'No price data for this ticker/range' : 'Loading chart...'}
        </div>
      )}
    </div>
  );
}
