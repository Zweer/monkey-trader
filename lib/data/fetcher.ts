import { fetchBars, fetchLatestQuotes } from './alpaca';
import { fetchKlines, fetchTickerPrices } from './binance';
import type { FetchResult, OHLCV, PriceResult, Ticker } from './types';

const EMPTY_RESULT: FetchResult<PriceResult[]> = { success: true, data: [] };

export async function fetchPrices(tickers: Ticker[]): Promise<PriceResult[]> {
  const stocks = tickers.filter((t) => t.type === 'stock').map((t) => t.symbol);
  const crypto = tickers.filter((t) => t.type === 'crypto').map((t) => t.symbol);

  const [stockResult, cryptoResult] = await Promise.all([
    stocks.length > 0 ? fetchLatestQuotes(stocks) : EMPTY_RESULT,
    crypto.length > 0 ? fetchTickerPrices(crypto) : EMPTY_RESULT,
  ]);

  const results: PriceResult[] = [];

  if (stockResult.success && stockResult.data) {
    results.push(...stockResult.data);
  } else if (stockResult.error) {
    console.error('[fetchPrices] Alpaca failed:', stockResult.error);
  }

  if (cryptoResult.success && cryptoResult.data) {
    results.push(...cryptoResult.data);
  } else if (cryptoResult.error) {
    console.error('[fetchPrices] Binance failed:', cryptoResult.error);
  }

  return results;
}

export async function fetchHistory(ticker: Ticker, days: number): Promise<OHLCV[]> {
  const result =
    ticker.type === 'stock'
      ? await fetchBars(ticker.symbol, days)
      : await fetchKlines(ticker.symbol, days);

  if (result.success && result.data) return result.data;

  console.error(`[fetchHistory] Failed for ${ticker.symbol}:`, result.error);
  return [];
}

export { DEFAULT_CRYPTO, DEFAULT_STOCKS } from './config';
export type { FetchResult, OHLCV, PriceResult, Ticker } from './types';
