import { fromBinancePair, toBinancePair } from './config';
import type { FetchResult, OHLCV, PriceResult } from './types';

const BASE_URL = 'https://api.binance.com/api/v3';
const TIMEOUT_MS = 10_000;

async function binanceFetch(url: string): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
}

export async function fetchTickerPrices(tickers: string[]): Promise<FetchResult<PriceResult[]>> {
  if (tickers.length === 0) return { success: true, data: [] };

  try {
    const pairs = tickers.map(toBinancePair);
    const symbolsParam = JSON.stringify(pairs);

    const [priceRes, changeRes] = await Promise.all([
      binanceFetch(`${BASE_URL}/ticker/price?symbols=${encodeURIComponent(symbolsParam)}`),
      binanceFetch(`${BASE_URL}/ticker/24hr?symbols=${encodeURIComponent(symbolsParam)}`),
    ]);

    if (!priceRes.ok) {
      return { success: false, error: `Binance price ${priceRes.status}: ${priceRes.statusText}` };
    }
    if (!changeRes.ok) {
      return { success: false, error: `Binance 24hr ${changeRes.status}: ${changeRes.statusText}` };
    }

    const prices = (await priceRes.json()) as Array<{ symbol: string; price: string }>;
    const changes = (await changeRes.json()) as Array<{
      symbol: string;
      priceChangePercent: string;
      volume: string;
    }>;

    const changeMap = new Map(changes.map((c) => [c.symbol, c]));

    const results: PriceResult[] = prices.map((p) => {
      const change = changeMap.get(p.symbol);
      return {
        ticker: fromBinancePair(p.symbol),
        price: Number(p.price),
        volume: change ? Number(change.volume) : 0,
        timestamp: new Date(),
        source: 'binance' as const,
        change24h: change ? Number(change.priceChangePercent) : 0,
      };
    });

    return { success: true, data: results };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Binance error';
    return { success: false, error: message };
  }
}

export async function fetchKlines(ticker: string, days: number): Promise<FetchResult<OHLCV[]>> {
  try {
    const symbol = toBinancePair(ticker);
    const params = new URLSearchParams({
      symbol,
      interval: '1d',
      limit: String(days),
    });

    const res = await binanceFetch(`${BASE_URL}/klines?${params}`);

    if (!res.ok) {
      return { success: false, error: `Binance ${res.status}: ${res.statusText}` };
    }

    const json = (await res.json()) as Array<
      [number, string, string, string, string, string, ...unknown[]]
    >;

    const data: OHLCV[] = json.map((k) => ({
      open: Number(k[1]),
      high: Number(k[2]),
      low: Number(k[3]),
      close: Number(k[4]),
      volume: Number(k[5]),
      timestamp: new Date(k[0]),
    }));

    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Binance error';
    return { success: false, error: message };
  }
}
