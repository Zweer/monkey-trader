import { createClient } from '@alpacahq/typescript-sdk';

import type { FetchResult, OHLCV, PriceResult } from './types';

const TIMEOUT_MS = 10_000;

function getClient(): ReturnType<typeof createClient> {
  return createClient({
    key: process.env.ALPACA_API_KEY!,
    secret: process.env.ALPACA_SECRET_KEY!,
  });
}

export async function fetchLatestQuotes(symbols: string[]): Promise<FetchResult<PriceResult[]>> {
  if (symbols.length === 0) return { success: true, data: [] };

  try {
    const client = getClient();
    const response = await Promise.race([
      client.getStocksQuotesLatest({ symbols: symbols.join(',') }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Alpaca timeout')), TIMEOUT_MS),
      ),
    ]);

    const quotes = response as unknown as Record<string, { ap: number; bp: number; t: string }>;
    const results: PriceResult[] = Object.entries(quotes).map(([symbol, q]) => ({
      ticker: symbol,
      price: (q.ap + q.bp) / 2,
      volume: 0,
      timestamp: new Date(q.t),
      source: 'alpaca' as const,
      change24h: 0,
    }));

    return { success: true, data: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Alpaca error';
    return { success: false, error: message };
  }
}

export async function fetchBars(symbol: string, days: number): Promise<FetchResult<OHLCV[]>> {
  try {
    const client = getClient();
    const end = new Date();
    const start = new Date(end.getTime() - days * 86400000);

    const response = await Promise.race([
      client.getStocksBars({
        symbols: symbol,
        timeframe: '1Day',
        start: start.toISOString(),
        end: end.toISOString(),
        limit: days,
        feed: 'iex',
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Alpaca timeout')), TIMEOUT_MS),
      ),
    ]);

    const barsMap = response as unknown as Record<
      string,
      Array<{ o: number; h: number; l: number; c: number; v: number; t: string }>
    >;
    const bars = barsMap[symbol] ?? [];

    const data: OHLCV[] = bars.map((b) => ({
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
      volume: b.v,
      timestamp: new Date(b.t),
    }));

    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Alpaca error';
    return { success: false, error: message };
  }
}
