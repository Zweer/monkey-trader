import { asc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { decisions, performance as perfTable } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const db = getDb();

  const daily = await db.select().from(perfTable).orderBy(asc(perfTable.date));
  const allDecisions = await db.select().from(decisions).where(eq(decisions.executed, true));

  // Compute metrics
  const totalReturn = daily.length > 0 ? Number(daily[daily.length - 1].cumulativePnlPercent) : 0;
  const totalTrades = allDecisions.length;
  const buyDecisions = allDecisions.filter((d) => d.action === 'buy');
  const sellDecisions = allDecisions.filter((d) => d.action === 'sell');

  // Max drawdown
  let peak = 10000;
  let maxDrawdown = 0;
  for (const day of daily) {
    const value = Number(day.portfolioValue);
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return NextResponse.json({
    metrics: {
      totalReturn,
      totalTrades,
      buyCount: buyDecisions.length,
      sellCount: sellDecisions.length,
      maxDrawdown,
      winRate: 0, // requires tracking per-trade P&L
    },
    daily: daily.map((d) => ({
      date: d.date,
      portfolioValue: Number(d.portfolioValue),
      cash: Number(d.cash),
      dailyPnl: Number(d.dailyPnl),
      dailyPnlPercent: Number(d.dailyPnlPercent),
      cumulativePnlPercent: Number(d.cumulativePnlPercent),
      benchmarkSp500: d.benchmarkSp500 ? Number(d.benchmarkSp500) : null,
      benchmarkBtc: d.benchmarkBtc ? Number(d.benchmarkBtc) : null,
    })),
  });
}
