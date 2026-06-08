/**
 * Integration test script — fetches real data from Alpaca + Binance.
 * Requires env vars: ALPACA_API_KEY, ALPACA_SECRET_KEY
 *
 * Usage: npx tsx scripts/test-fetch.ts
 */

import { fetchHistory, fetchPrices } from '../lib/data/fetcher';
import type { Ticker } from '../lib/data/types';

const TICKERS: Ticker[] = [
  { symbol: 'AAPL', type: 'stock' },
  { symbol: 'MSFT', type: 'stock' },
  { symbol: 'BTC', type: 'crypto' },
  { symbol: 'ETH', type: 'crypto' },
];

async function main(): Promise<void> {
  console.log('--- fetchPrices ---');
  const start = Date.now();
  const prices = await fetchPrices(TICKERS);
  const elapsed = Date.now() - start;

  for (const p of prices) {
    console.log(`  ${p.ticker}: $${p.price} (${p.source}, 24h: ${p.change24h}%)`);
  }
  console.log(`  Fetched ${prices.length} prices in ${elapsed}ms\n`);

  console.log('--- fetchHistory (BTC, 7 days) ---');
  const history = await fetchHistory({ symbol: 'BTC', type: 'crypto' }, 7);
  for (const bar of history) {
    console.log(
      `  ${bar.timestamp.toISOString().slice(0, 10)}: O=${bar.open} H=${bar.high} L=${bar.low} C=${bar.close}`,
    );
  }
  console.log(`  ${history.length} bars\n`);

  console.log('Done.');
}

main().catch(console.error);
