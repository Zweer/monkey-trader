import type { Ticker } from './types';

export const CRYPTO_PAIR_MAP: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  BNB: 'BNBUSDT',
  SOL: 'SOLUSDT',
  XRP: 'XRPUSDT',
  ADA: 'ADAUSDT',
  DOGE: 'DOGEUSDT',
  AVAX: 'AVAXUSDT',
  DOT: 'DOTUSDT',
  MATIC: 'MATICUSDT',
};

export const DEFAULT_STOCKS: Ticker[] = [
  { symbol: 'AAPL', type: 'stock' },
  { symbol: 'MSFT', type: 'stock' },
  { symbol: 'GOOGL', type: 'stock' },
  { symbol: 'AMZN', type: 'stock' },
  { symbol: 'NVDA', type: 'stock' },
  { symbol: 'TSLA', type: 'stock' },
  { symbol: 'META', type: 'stock' },
  { symbol: 'JPM', type: 'stock' },
  { symbol: 'V', type: 'stock' },
  { symbol: 'JNJ', type: 'stock' },
];

export const DEFAULT_CRYPTO: Ticker[] = Object.keys(CRYPTO_PAIR_MAP).map((symbol) => ({
  symbol,
  type: 'crypto' as const,
}));

export function toBinancePair(ticker: string): string {
  const pair = CRYPTO_PAIR_MAP[ticker];
  if (!pair) throw new Error(`Unknown crypto ticker: ${ticker}`);
  return pair;
}

export function fromBinancePair(pair: string): string {
  const entry = Object.entries(CRYPTO_PAIR_MAP).find(([, v]) => v === pair);
  if (!entry) throw new Error(`Unknown Binance pair: ${pair}`);
  return entry[0];
}
