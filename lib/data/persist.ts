import { desc, eq } from 'drizzle-orm';

import type { Db } from '@/db';
import { priceSnapshots } from '@/db/schema';

import type { PriceResult } from './types';

export async function savePriceSnapshots(db: Db, results: PriceResult[]): Promise<void> {
  if (results.length === 0) return;

  await db.insert(priceSnapshots).values(
    results.map((r) => ({
      ticker: r.ticker,
      price: String(r.price),
      volume: String(r.volume),
      timestamp: r.timestamp,
      source: r.source,
    })),
  );
}

export async function getLastSnapshot(db: Db, ticker: string): Promise<PriceResult | null> {
  const rows = await db
    .select()
    .from(priceSnapshots)
    .where(eq(priceSnapshots.ticker, ticker))
    .orderBy(desc(priceSnapshots.timestamp))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ticker: row.ticker,
    price: Number(row.price),
    volume: Number(row.volume),
    timestamp: row.timestamp,
    source: row.source,
    change24h: 0,
  };
}
