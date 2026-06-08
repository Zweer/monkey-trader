import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { decisions, indicators, priceSnapshots } from '@/db/schema';

export const dynamic = 'force-dynamic';

const RANGE_DAYS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, all: 365 };

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const ticker = url.searchParams.get('ticker');
  const range = url.searchParams.get('range') ?? '30d';

  if (!ticker) {
    return NextResponse.json({ error: 'ticker param required' }, { status: 400 });
  }

  const db = getDb();
  const days = RANGE_DAYS[range] ?? 30;
  const since = new Date(Date.now() - days * 86400000);

  // Price data (OHLCV simplified from snapshots)
  const prices = await db
    .select()
    .from(priceSnapshots)
    .where(and(eq(priceSnapshots.ticker, ticker), gte(priceSnapshots.timestamp, since)))
    .orderBy(asc(priceSnapshots.timestamp));

  // Indicators
  const indRows = await db
    .select()
    .from(indicators)
    .where(and(eq(indicators.ticker, ticker), gte(indicators.timestamp, since)))
    .orderBy(asc(indicators.timestamp));

  // Decision markers
  const decisionRows = await db
    .select()
    .from(decisions)
    .where(and(eq(decisions.ticker, ticker), gte(decisions.timestamp, since)))
    .orderBy(desc(decisions.timestamp));

  return NextResponse.json({
    ticker,
    range,
    candles: prices.map((p) => ({
      time: Math.floor(p.timestamp.getTime() / 1000),
      open: Number(p.price),
      high: Number(p.price),
      low: Number(p.price),
      close: Number(p.price),
      volume: Number(p.volume),
    })),
    indicators: indRows.map((i) => ({
      time: Math.floor(i.timestamp.getTime() / 1000),
      ma20: i.ma20 ? Number(i.ma20) : null,
      ma50: i.ma50 ? Number(i.ma50) : null,
      bbUpper: i.bbUpper ? Number(i.bbUpper) : null,
      bbLower: i.bbLower ? Number(i.bbLower) : null,
    })),
    markers: decisionRows.map((d) => ({
      time: Math.floor(d.timestamp.getTime() / 1000),
      position: d.action === 'buy' ? 'belowBar' : 'aboveBar',
      color: d.action === 'buy' ? '#22c55e' : d.action === 'sell' ? '#ef4444' : '#eab308',
      shape: d.action === 'hold' ? 'circle' : 'arrowUp',
      text: `${d.action.toUpperCase()} ${(Number(d.confidence) * 100).toFixed(0)}%`,
    })),
  });
}
