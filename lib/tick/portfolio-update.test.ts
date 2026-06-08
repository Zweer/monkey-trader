import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '@/db';
import { getDbWithMigrations } from '@/db';
import { performance as perfTable, portfolioState } from '@/db/schema';

import { updatePortfolioState, upsertDailyPerformance } from './portfolio-update';

let db: Db;

beforeEach(async () => {
  vi.stubEnv('DATABASE_URL', '');
  db = await getDbWithMigrations();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('updatePortfolioState', () => {
  it('should insert portfolio state when none exists', async () => {
    const result = await updatePortfolioState(db, 7000, [
      { shares: 10, currentPrice: 150 },
      { shares: 5, currentPrice: 100 },
    ]);

    expect(result.totalValue).toBe(9000); // 7000 + 1500 + 500
    const rows = await db.select().from(portfolioState);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].cash)).toBe(7000);
    expect(Number(rows[0].totalValue)).toBe(9000);
  });

  it('should update existing portfolio state', async () => {
    await updatePortfolioState(db, 5000, [{ shares: 10, currentPrice: 100 }]);
    await updatePortfolioState(db, 6000, [{ shares: 10, currentPrice: 110 }]);

    const rows = await db.select().from(portfolioState);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].cash)).toBe(6000);
    expect(Number(rows[0].totalValue)).toBe(7100);
  });
});

describe('upsertDailyPerformance', () => {
  it('should insert daily performance entry', async () => {
    await upsertDailyPerformance(db, 10500, 5000, 10000);

    const today = new Date().toISOString().slice(0, 10);
    const rows = await db.select().from(perfTable).where(eq(perfTable.date, today));
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].dailyPnl)).toBe(500);
    expect(Number(rows[0].dailyPnlPercent)).toBe(5);
    expect(Number(rows[0].cumulativePnlPercent)).toBe(5);
  });

  it('should update same-day entry', async () => {
    await upsertDailyPerformance(db, 10200, 5000, 10000);
    await upsertDailyPerformance(db, 10500, 4500, 10000);

    const today = new Date().toISOString().slice(0, 10);
    const rows = await db.select().from(perfTable).where(eq(perfTable.date, today));
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].dailyPnl)).toBe(500);
  });
});
