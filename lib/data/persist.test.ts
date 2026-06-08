import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '@/db';
import { getDbWithMigrations } from '@/db';

import { getLastSnapshot, savePriceSnapshots } from './persist';
import type { PriceResult } from './types';

let db: Db;

beforeEach(async () => {
  vi.stubEnv('DATABASE_URL', '');
  db = await getDbWithMigrations();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('savePriceSnapshots', () => {
  it('should insert price snapshots into the database', async () => {
    const results: PriceResult[] = [
      {
        ticker: 'AAPL',
        price: 150.5,
        volume: 1000000,
        timestamp: new Date('2026-06-08T14:00:00Z'),
        source: 'alpaca',
        change24h: 1.2,
      },
      {
        ticker: 'BTC',
        price: 67000,
        volume: 15000,
        timestamp: new Date('2026-06-08T14:00:00Z'),
        source: 'binance',
        change24h: 2.5,
      },
    ];

    await savePriceSnapshots(db, results);

    const snapshot = await getLastSnapshot(db, 'AAPL');
    expect(snapshot).not.toBeNull();
    expect(snapshot!.ticker).toBe('AAPL');
    expect(snapshot!.price).toBeCloseTo(150.5);
    expect(snapshot!.source).toBe('alpaca');
  });

  it('should do nothing for empty results', async () => {
    await savePriceSnapshots(db, []);

    const snapshot = await getLastSnapshot(db, 'NVDA');
    expect(snapshot).toBeNull();
  });
});

describe('getLastSnapshot', () => {
  it('should return the most recent snapshot for a ticker', async () => {
    const results: PriceResult[] = [
      {
        ticker: 'BTC',
        price: 66000,
        volume: 10000,
        timestamp: new Date('2026-06-08T12:00:00Z'),
        source: 'binance',
        change24h: 0,
      },
      {
        ticker: 'BTC',
        price: 67000,
        volume: 15000,
        timestamp: new Date('2026-06-08T14:00:00Z'),
        source: 'binance',
        change24h: 0,
      },
    ];

    await savePriceSnapshots(db, results);

    const snapshot = await getLastSnapshot(db, 'BTC');
    expect(snapshot!.price).toBeCloseTo(67000);
  });

  it('should return null for unknown ticker', async () => {
    const snapshot = await getLastSnapshot(db, 'UNKNOWN');
    expect(snapshot).toBeNull();
  });
});
