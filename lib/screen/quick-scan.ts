import { fetchPrices } from '@/lib/data/fetcher';
import type { PriceResult, Ticker } from '@/lib/data/types';
import { calculateSMA } from '@/lib/indicators/moving-averages';
import { calculateRSI } from '@/lib/indicators/rsi';

import type { UniverseTicker } from './universe';

export type QuickScanResult = {
  ticker: string;
  name: string;
  sector: string;
  type: 'stock' | 'crypto';
  price: number;
  change24h: number;
  rsi14: number | null;
  aboveMa50: boolean | null;
};

export async function quickScan(candidates: UniverseTicker[]): Promise<QuickScanResult[]> {
  const tickers: Ticker[] = candidates.map((c) => ({ symbol: c.symbol, type: c.type }));
  const prices = await fetchPrices(tickers);
  const priceMap = new Map<string, PriceResult>(prices.map((p) => [p.ticker, p]));

  const results: QuickScanResult[] = [];

  for (const c of candidates) {
    const price = priceMap.get(c.symbol);
    if (!price) continue;

    results.push({
      ticker: c.symbol,
      name: c.name,
      sector: c.sector,
      type: c.type,
      price: price.price,
      change24h: price.change24h,
      rsi14: null,
      aboveMa50: null,
    });
  }

  return results;
}

/**
 * Enrich scan results with indicators if history is available.
 */
export function enrichWithHistory(result: QuickScanResult, closes: number[]): QuickScanResult {
  const rsi14 = calculateRSI(closes);
  const ma50 = calculateSMA(closes, 50);
  const currentPrice = closes[closes.length - 1];

  return {
    ...result,
    rsi14,
    aboveMa50: ma50 !== null ? currentPrice > ma50 : null,
  };
}
