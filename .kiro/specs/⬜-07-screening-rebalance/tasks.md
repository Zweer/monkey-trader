# Spec 07 — Screening & Rebalance Tasks

## Dependency Order

```
T1 (Universe) → T2 (Quick Indicators) → T3 (Screen Endpoint) → T4 (Rebalance Endpoint) → T5 (Integration Test)
```

## T1 — Universe Management

- [ ] Create `lib/screen/universe.ts`
- [ ] Hardcode S&P 100 tickers (symbol, name, sector)
- [ ] Implement `fetchCryptoUniverse(): Promise<Ticker[]>` — Binance top 30 by volume, exclude stablecoins/wrapped
- [ ] Implement `getFullUniverse(): Promise<Ticker[]>` — merge stocks + crypto
- [ ] Test: crypto excludes stablecoins, total universe is ~130

**Acceptance:** Universe returns ~100 stocks + ~30 crypto, correctly filtered.

## T2 — Quick Indicators (Screening)

- [ ] Create `lib/screen/quick-scan.ts`
- [ ] Implement `quickScan(tickers: Ticker[]): Promise<QuickScanResult[]>`
- [ ] For each candidate: current price, 24h change, RSI (if history available), MA50 position
- [ ] Batch price fetches (reuse market data layer)
- [ ] Skip full indicator computation (only RSI + MA50 for speed)
- [ ] Must complete in < 15s for 130 tickers

**Acceptance:** Quick scan returns basic metrics for all candidates within 15s.

## T3 — Screen Endpoint

- [ ] Create `lib/screen/index.ts`
- [ ] Implement `runScreening(): Promise<ScreeningResult>`
- [ ] Flow: universe → quick scan → filter → build prompt → Gemini Pro → validate → update watchlist
- [ ] Prompt builder: format candidates as table, include current watchlist + positions
- [ ] Output validation: verify selected tickers exist in universe, positions not dropped
- [ ] Update watchlist table: activate selected, deactivate dropped
- [ ] Log transitions (added/removed tickers with reasons)
- [ ] Update `app/api/screen/route.ts` to call `runScreening()`
- [ ] Test: mock Gemini, verify watchlist correctly updated, positions preserved

**Acceptance:** Watchlist updated with 10-30 titles. Held positions never removed.

## T4 — Rebalance Endpoint

- [ ] Create `lib/rebalance/index.ts`
- [ ] Implement `runRebalance(): Promise<RebalanceResult>`
- [ ] Flow: portfolio state → performance history → build prompt → Gemini Pro → validate → risk check → execute
- [ ] Prompt builder: full portfolio breakdown + weekly performance + sector weights
- [ ] Output validation: verify actions reference held tickers, sizes are valid
- [ ] Each approved action: execute as synthetic decision (reuses tick trade execution)
- [ ] Max 5 actions per rebalance
- [ ] Update `app/api/rebalance/route.ts` to call `runRebalance()`
- [ ] Test: mock Gemini, verify actions pass risk engine, portfolio correctly updated

**Acceptance:** Rebalance executes valid actions. Risk-violating suggestions rejected.

## T5 — Integration Test

- [ ] Create `scripts/test-screen.ts`: real Gemini Pro call with mock portfolio
- [ ] Create `scripts/test-rebalance.ts`: real Gemini Pro call with mock portfolio
- [ ] Verify output matches expected schemas
- [ ] Check token usage stays within budget (~5000-8000 input tokens)

**Acceptance:** Real Pro calls return valid, reasoned results within token budget.
