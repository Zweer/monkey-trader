// Allocation limits
export const MAX_SINGLE_POSITION_PCT = 20;
export const MAX_SINGLE_SECTOR_PCT = 40;
export const MIN_SAFE_ASSETS_PCT = 30;
export const MAX_SPECULATIVE_PCT = 30;
export const MIN_POSITION_SIZE_PCT = 3;

// Position rules
export const STOP_LOSS_PCT = -8;
export const TAKE_PROFIT_PCT = 15;
export const TRAILING_STOP_PEAK_PCT = 20;
export const TRAILING_STOP_DROP_PCT = 5;
export const MAX_HOLD_DAYS = 14;

// Exposure rules
export const MAX_INVESTED_PCT = 70;
export const MIN_CASH_PCT = 30;
export const DEFENSIVE_MODE_DRAWDOWN_PCT = -10;

// Operational rules
export const MAX_TRADES_PER_DAY = 3;
export const MAX_SAME_SECTOR_PER_DAY = 2;
export const COOLDOWN_AFTER_SELL_MS = 4 * 60 * 60 * 1000; // 4 hours

// Asset classification
export const SAFE_CRYPTO = new Set(['BTC', 'ETH']);
export const SAFE_STOCKS = new Set(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'JPM', 'V', 'JNJ']);
