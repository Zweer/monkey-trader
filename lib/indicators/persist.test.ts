import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '@/db';
import { getDbWithMigrations } from '@/db';
import { indicators } from '@/db/schema';

import { saveAllIndicators, saveIndicators } from './persist';
import type { IndicatorResult } from './types';

let db: Db;

beforeEach(async () => {
  vi.stubEnv('DATABASE_URL', '');
  db = await getDbWithMigrations();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const mockResult: IndicatorResult = {
  rsi14: 55.3,
  macd: { line: 1.5, signal: 0.8, histogram: 0.7 },
  ma20: 150,
  ma50: 145,
  ma200: 130,
  bollingerBands: { upper: 160, middle: 150, lower: 140 },
  volumeSma20: 1000000,
  signalScore: 3,
  direction: 'bullish',
  signals: [],
};

describe('saveIndicators', () => {
  it('should save indicators to the database', async () => {
    await saveIndicators(db, 'AAPL', mockResult);

    const rows = await db.select().from(indicators).where(eq(indicators.ticker, 'AAPL'));
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].rsi14)).toBeCloseTo(55.3);
    expect(Number(rows[0].macdLine)).toBeCloseTo(1.5);
    expect(Number(rows[0].ma50)).toBeCloseTo(145);
    expect(rows[0].signalScore).toBe(3);
  });

  it('should handle null values', async () => {
    const partial: IndicatorResult = {
      ...mockResult,
      rsi14: null,
      macd: null,
      ma200: null,
      bollingerBands: null,
    };

    await saveIndicators(db, 'ETH', partial);

    const rows = await db.select().from(indicators).where(eq(indicators.ticker, 'ETH'));
    expect(rows[0].rsi14).toBeNull();
    expect(rows[0].macdLine).toBeNull();
    expect(rows[0].ma200).toBeNull();
    expect(rows[0].bbUpper).toBeNull();
  });
});

describe('saveAllIndicators', () => {
  it('should save multiple tickers', async () => {
    const results = new Map<string, IndicatorResult>([
      ['SOL', mockResult],
      ['DOT', { ...mockResult, signalScore: 5 }],
    ]);

    await saveAllIndicators(db, results);

    const rows = await db.select().from(indicators).where(eq(indicators.ticker, 'SOL'));
    expect(rows).toHaveLength(1);
    const rows2 = await db.select().from(indicators).where(eq(indicators.ticker, 'DOT'));
    expect(rows2).toHaveLength(1);
    expect(rows2[0].signalScore).toBe(5);
  });
});
