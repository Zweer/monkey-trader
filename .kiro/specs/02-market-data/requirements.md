# Spec 02 — Market Data Layer

## Vision

MonkeyTrader needs real-time price data from two sources: Alpaca (US stocks, paper trading) and Binance (crypto). The data layer must be fast, resilient to API failures, and respect rate limits — all within the 60s Vercel timeout.

## Goal

A unified market data interface that fetches current prices and recent history for all watched titles, handling errors gracefully and persisting snapshots to the database.

## Requirements

### 1. Unified Data Interface
- Single `fetchPrices(tickers: Ticker[]): Promise<PriceResult[]>` function
- Routes to correct provider based on ticker type (stock vs crypto)
- Returns normalized shape regardless of source:
  ```typescript
  type PriceResult = {
    ticker: string;
    price: number;
    volume: number;
    timestamp: Date;
    source: 'alpaca' | 'binance';
    change24h: number; // percent
  };
  ```
- Fetches in parallel (stocks batch + crypto batch)

### 2. Alpaca Provider (Stocks)
- Use Alpaca Market Data API (IEX feed, free tier)
- Endpoints needed:
  - Latest quote: `GET /v2/stocks/{symbol}/quotes/latest`
  - Bars (history): `GET /v2/stocks/bars?symbols=...&timeframe=1Day&limit=200`
- Auth: `APCA-API-KEY-ID` + `APCA-API-SECRET-KEY` headers
- Rate limit: 200 req/min — batch where possible
- Market hours awareness: skip fetch if market closed (weekends, holidays)
  - Still fetch last known price, just don't expect movement
- Batch multiple symbols in one call (bars endpoint supports multi-symbol)

### 3. Binance Provider (Crypto)
- Use Binance public API (no auth needed for market data)
- Endpoints needed:
  - Ticker price: `GET /api/v3/ticker/price?symbols=[...]`
  - 24h change: `GET /api/v3/ticker/24hr?symbols=[...]`
  - Klines (history): `GET /api/v3/klines?symbol=...&interval=1d&limit=200`
- Symbols use USDT pair (e.g., `BTCUSDT`, `ETHUSDT`)
- Rate limit: 1200 req/min — generous, but batch anyway
- 24/7 availability — always fetch

### 4. Historical Data (for Indicators)
- `fetchHistory(ticker: string, days: number): Promise<OHLCV[]>`
- Returns OHLCV data (open, high, low, close, volume) for N days
- Used by indicators engine to compute MA, RSI, etc.
- Cache in `price_snapshots` table — don't re-fetch if recent data exists
  ```typescript
  type OHLCV = {
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: Date;
  };
  ```

### 5. Persistence
- Save every price fetch to `price_snapshots` table
- Batch insert for efficiency
- Include source and timestamp

### 6. Error Handling
- If Alpaca is down: log error, return stale data (last snapshot from DB), continue with crypto
- If Binance is down: log error, return stale data, continue with stocks
- Never let one provider failure crash the entire tick
- Timeout per provider: 10s max
- Return `{ success: boolean; data?: PriceResult; error?: string }` wrapper

### 7. Ticker Mapping
- Stocks: use standard ticker (AAPL, MSFT, GOOGL, etc.)
- Crypto: map friendly name to Binance pair (BTC → BTCUSDT, ETH → ETHUSDT)
- Mapping lives in a config/constant file, easily extendable

## Technical Constraints

- Total fetch time budget: ~10-15s (leaves room for indicators + LLM in the 60s window)
- Alpaca free tier: IEX data (15-min delayed for free, but real-time quotes for paper accounts)
- Binance: no auth needed for public endpoints
- Must work in Vercel serverless (no persistent connections, no WebSockets)

## Success Criteria

- `fetchPrices([stock, crypto])` returns normalized data for both
- Alpaca failure → graceful fallback, crypto still works
- Binance failure → graceful fallback, stocks still work
- Price snapshots saved to DB after each fetch
- `fetchHistory("AAPL", 200)` returns 200 days of OHLCV
- Total execution time < 15s for 30 tickers
- Tests pass with mocked API responses

## Non-Goals (for this spec)

- WebSocket streaming (would need persistent server)
- Real-time sub-second data
- Order execution (paper trading orders come later)
- Multiple exchange support beyond Alpaca + Binance
