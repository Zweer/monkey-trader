import type { FetchResult, OHLCV, PriceResult } from './types';

const BASE_URL = 'https://data.alpaca.markets/v2';
const TIMEOUT_MS = 10_000;

function getHeaders(): HeadersInit {
  return {
    'APCA-API-KEY-ID': process.env.ALPACA_API_KEY!,
    'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY!,
  };
}

async function alpacaFetch(url: string): Promise<Response> {
  return fetch(url, {
    headers: getHeaders(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export async function fetchLatestQuotes(symbols: string[]): Promise<FetchResult<PriceResult[]>> {
  if (symbols.length === 0) return { success: true, data: [] };

  try {
    const params = new URLSearchParams({ symbols: symbols.join(','), feed: 'iex' });
    const res = await alpacaFetch(`${BASE_URL}/stocks/quotes/latest?${params}`);

    if (!res.ok) {
      return { success: false, error: `Alpaca ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as {
      quotes: Record<string, { ap: number; as: number; bp: number; bs: number; t: string }>;
    };

    const results: PriceResult[] = Object.entries(json.quotes).map(([symbol, q]) => ({
      ticker: symbol,
      price: (q.ap + q.bp) / 2, // midpoint
      volume: 0, // quotes don't include volume
      timestamp: new Date(q.t),
      source: 'alpaca' as const,
      change24h: 0, // calculated separately if needed
    }));

    return { success: true, data: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Alpaca error';
    return { success: false, error: message };
  }
}

export async function fetchBars(symbol: string, days: number): Promise<FetchResult<OHLCV[]>> {
  try {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      symbols: symbol,
      timeframe: '1Day',
      start: start.toISOString(),
      end: end.toISOString(),
      limit: String(days),
      feed: 'iex',
    });

    const res = await alpacaFetch(`${BASE_URL}/stocks/bars?${params}`);

    if (!res.ok) {
      return { success: false, error: `Alpaca ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as {
      bars: Record<
        string,
        Array<{ o: number; h: number; l: number; c: number; v: number; t: string }>
      >;
    };

    const bars = json.bars[symbol] ?? [];
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
