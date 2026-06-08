export type AssetType = 'stock' | 'crypto';
export type DataSource = 'alpaca' | 'binance';

export type Ticker = {
  symbol: string;
  type: AssetType;
};

export type PriceResult = {
  ticker: string;
  price: number;
  volume: number;
  timestamp: Date;
  source: DataSource;
  change24h: number;
};

export type OHLCV = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: Date;
};

export type FetchResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
