# Spec 02 — Market Data Tasks

## Dependency Order

```
T1 (Types + Interface) → T2 (Alpaca Provider) → T3 (Binance Provider) → T4 (Unified Fetcher) → T5 (Persistence) → T6 (Integration Test)
```

## T1 — Types & Interface

- [ ] Create `lib/data/types.ts`: `PriceResult`, `OHLCV`, `FetchResult<T>`, `MarketDataProvider`
- [ ] Create `lib/data/config.ts`: ticker mapping (crypto friendly name → Binance pair)
- [ ] Create `lib/data/market-hours.ts`: `isMarketOpen(): boolean` (US market hours + holidays)
- [ ] Tests for market hours utility

**Acceptance:** Types compile, market hours correctly identifies weekends and US holidays.

## T2 — Alpaca Provider

- [ ] Create `lib/data/alpaca.ts`
- [ ] Implement `fetchLatestQuotes(symbols: string[]): Promise<FetchResult<PriceResult[]>>`
- [ ] Implement `fetchBars(symbol: string, days: number): Promise<FetchResult<OHLCV[]>>`
- [ ] Auth via env vars `ALPACA_API_KEY` + `ALPACA_SECRET_KEY`
- [ ] 10s timeout per request
- [ ] Batch symbols in single call where API supports it
- [ ] Create `lib/data/alpaca.test.ts`: mock HTTP, test success + timeout + error cases

**Acceptance:** Mocked tests pass. Correct headers sent. Errors wrapped gracefully.

## T3 — Binance Provider

- [ ] Create `lib/data/binance.ts`
- [ ] Implement `fetchTickerPrices(symbols: string[]): Promise<FetchResult<PriceResult[]>>`
- [ ] Implement `fetchKlines(symbol: string, days: number): Promise<FetchResult<OHLCV[]>>`
- [ ] No auth needed (public endpoints)
- [ ] 10s timeout per request
- [ ] Map friendly ticker to USDT pair using config
- [ ] Create `lib/data/binance.test.ts`: mock HTTP, test success + timeout + error cases

**Acceptance:** Mocked tests pass. Ticker mapping works. Errors wrapped gracefully.

## T4 — Unified Fetcher

- [ ] Create `lib/data/index.ts`
- [ ] Implement `fetchPrices(tickers: Ticker[]): Promise<PriceResult[]>`
- [ ] Split tickers by type, fetch stocks + crypto in parallel
- [ ] If one provider fails, still return results from the other
- [ ] Implement `fetchHistory(ticker: string, days: number): Promise<OHLCV[]>`
- [ ] Create `lib/data/index.test.ts`: test parallel fetch, partial failure, empty watchlist

**Acceptance:** Unified function returns normalized results. Partial failures don't crash.

## T5 — Persistence

- [ ] Create `lib/data/persist.ts`
- [ ] Implement `savePriceSnapshots(results: PriceResult[]): Promise<void>`
- [ ] Batch insert into `price_snapshots` table
- [ ] Implement `getLastSnapshot(ticker: string): Promise<PriceResult | null>` (fallback for failures)
- [ ] Test with mocked DB

**Acceptance:** Snapshots saved correctly. Fallback returns last known price.

## T6 — Integration Test

- [ ] Create a manual test script (`scripts/test-fetch.ts`)
- [ ] Fetches real data from Alpaca + Binance (requires env vars)
- [ ] Prints results, verifies shape
- [ ] Not part of `npm test` (requires network + secrets)

**Acceptance:** Script runs locally, fetches real prices, prints normalized output.
