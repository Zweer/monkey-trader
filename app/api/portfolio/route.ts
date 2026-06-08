import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { decisions, portfolio, portfolioState } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const db = getDb();

  const stateRows = await db.select().from(portfolioState).limit(1);
  const posRows = await db.select().from(portfolio);

  const cash = stateRows.length > 0 ? Number(stateRows[0].cash) : 10000;
  const totalValue = stateRows.length > 0 ? Number(stateRows[0].totalValue) : 10000;

  const positions = posRows.map((p) => ({
    ticker: p.ticker,
    shares: Number(p.shares),
    avgEntryPrice: Number(p.avgEntryPrice),
    currentPrice: Number(p.currentPrice),
    pnlPercent:
      ((Number(p.currentPrice) - Number(p.avgEntryPrice)) / Number(p.avgEntryPrice)) * 100,
    weightPercent:
      totalValue > 0 ? ((Number(p.shares) * Number(p.currentPrice)) / totalValue) * 100 : 0,
  }));

  // Win rate from executed decisions
  const allDecisions = await db.select().from(decisions).where(eq(decisions.executed, true));
  const wins = allDecisions.filter((d) => d.action === 'buy').length; // simplified
  const winRate = allDecisions.length > 0 ? (wins / allDecisions.length) * 100 : 0;

  const dailyPnl = totalValue - 10000; // simplified from inception

  return NextResponse.json({
    cash,
    totalValue,
    dailyPnl,
    dailyPnlPercent: ((totalValue - 10000) / 10000) * 100,
    winRate,
    positions,
    investedPercent: totalValue > 0 ? ((totalValue - cash) / totalValue) * 100 : 0,
    isDefensiveMode: false,
  });
}
