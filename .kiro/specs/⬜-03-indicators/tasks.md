# Spec 03 — Technical Indicators Tasks

## Dependency Order

```
T1 (Core Math) → T2 (Signal Scoring) → T3 (Compute All) → T4 (Persistence) → T5 (Validation)
```

## T1 — Core Indicator Functions

- [ ] Create `lib/indicators/rsi.ts`: `calculateRSI(closes: number[], period?: number): number | null`
- [ ] Create `lib/indicators/macd.ts`: `calculateMACD(closes: number[]): MACDResult | null`
- [ ] Create `lib/indicators/moving-averages.ts`: `calculateSMA(closes: number[], period: number): number | null`
- [ ] Create `lib/indicators/bollinger-bands.ts`: `calculateBollingerBands(closes: number[], period?: number, stdDev?: number): BBResult | null`
- [ ] Create `lib/indicators/volume.ts`: `calculateVolumeSMA(volumes: number[], period?: number): number | null`
- [ ] Unit test each with known test vectors (verified against external TA tools)

**Acceptance:** Each function returns correct values for known datasets. Handles insufficient data (returns null).

## T2 — Signal Scoring

- [ ] Create `lib/indicators/signals.ts`
- [ ] Implement `evaluateSignals(indicators: IndicatorResult, currentPrice: number, currentVolume: number): SignalEvaluation`
- [ ] Scoring rules per README: RSI thresholds, MACD direction, MA position, BB proximity, volume confirmation
- [ ] Returns `{ score: 0-5, direction, signals: SignalDetail[] }`
- [ ] Test: all bullish → score 5, all bearish → score 5, mixed → lower score, neutral → 0

**Acceptance:** Signal score correctly reflects number of aligned indicators. Tests cover all combinations.

## T3 — Compute All (Orchestrator)

- [ ] Create `lib/indicators/index.ts`
- [ ] Implement `computeIndicators(history: OHLCV[], currentPrice: number, currentVolume: number): IndicatorResult`
- [ ] Calls all individual functions, then evaluates signals
- [ ] Handles partial data gracefully (nulls for missing indicators)
- [ ] Integration test with 200-bar realistic dataset

**Acceptance:** Single function call returns complete indicator state for a ticker.

## T4 — Persistence

- [ ] Create `lib/indicators/persist.ts`
- [ ] Implement `saveIndicators(ticker: string, result: IndicatorResult): Promise<void>`
- [ ] Maps IndicatorResult to `indicators` table row
- [ ] Batch save for multiple tickers: `saveAllIndicators(results: Map<string, IndicatorResult>): Promise<void>`

**Acceptance:** Indicators saved to DB with correct values and timestamp.

## T5 — Validation Against Real Data

- [ ] Create `scripts/validate-indicators.ts`
- [ ] Fetch real AAPL + BTC history via market data layer
- [ ] Compute indicators
- [ ] Compare RSI/MACD values against TradingView (manual spot-check)
- [ ] Document any acceptable deviation (floating point precision)

**Acceptance:** Indicators within ±0.5% of TradingView values for same data.
