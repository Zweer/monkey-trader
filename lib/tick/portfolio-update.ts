import { eq } from 'drizzle-orm';

import type { Db } from '@/db';
import { performance as perfTable, portfolioState } from '@/db/schema';

export async function updatePortfolioState(
  db: Db,
  cash: number,
  positions: Array<{ shares: number; currentPrice: number }>,
): Promise<{ totalValue: number }> {
  const invested = positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const totalValue = cash + invested;
  const now = new Date();

  // Upsert portfolio_state (single row, id=1)
  const existing = await db.select().from(portfolioState).where(eq(portfolioState.id, 1)).limit(1);

  if (existing.length === 0) {
    await db.insert(portfolioState).values({
      cash: String(cash),
      totalValue: String(totalValue),
      updatedAt: now,
    });
  } else {
    await db
      .update(portfolioState)
      .set({ cash: String(cash), totalValue: String(totalValue), updatedAt: now })
      .where(eq(portfolioState.id, 1));
  }

  return { totalValue };
}

export async function upsertDailyPerformance(
  db: Db,
  totalValue: number,
  cash: number,
  previousValue: number,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const dailyPnl = totalValue - previousValue;
  const dailyPnlPercent = previousValue > 0 ? (dailyPnl / previousValue) * 100 : 0;
  const cumulativePnlPercent = ((totalValue - 10000) / 10000) * 100; // from initial 10k

  const existing = await db.select().from(perfTable).where(eq(perfTable.date, today)).limit(1);

  if (existing.length === 0) {
    await db.insert(perfTable).values({
      date: today,
      portfolioValue: String(totalValue),
      cash: String(cash),
      dailyPnl: String(dailyPnl),
      dailyPnlPercent: String(dailyPnlPercent),
      cumulativePnlPercent: String(cumulativePnlPercent),
    });
  } else {
    await db
      .update(perfTable)
      .set({
        portfolioValue: String(totalValue),
        cash: String(cash),
        dailyPnl: String(dailyPnl),
        dailyPnlPercent: String(dailyPnlPercent),
        cumulativePnlPercent: String(cumulativePnlPercent),
      })
      .where(eq(perfTable.date, today));
  }
}
