# Spec 03 — Technical Indicators Engine

## Vision

The algorithmic layer is the first line of defense: it runs on every tick, is instant, free, and determines whether the expensive LLM should be invoked. It computes standard technical indicators and produces a signal score.

## Goal

A pure-function indicators engine that takes OHLCV history and returns all indicator values + a composite signal score (0-5) indicating how many indicators align in the same direction.

## Requirements

### 1. Indicator Functions (Pure Math)
All indicators are pure functions: `(data: OHLCV[]) => number | null`. No side effects, no DB access.

#### RSI (Relative Strength Index)
- Period: 14
- Returns: 0-100
- Signal: <30 = oversold (bullish), >70 = overbought (bearish)

#### MACD (Moving Average Convergence Divergence)
- Fast: 12, Slow: 26, Signal: 9
- Returns: `{ line, signal, histogram }`
- Signal: histogram crossing zero (positive = bullish, negative = bearish)

#### Moving Averages
- SMA 20, SMA 50, SMA 200
- Signal: price above MA = bullish, price below = bearish
- Golden cross (MA50 > MA200) = strong bullish
- Death cross (MA50 < MA200) = strong bearish

#### Bollinger Bands
- Period: 20, StdDev: 2
- Returns: `{ upper, middle, lower }`
- Signal: price near lower band = oversold, near upper = overbought

#### Volume Analysis
- Volume SMA 20
- Signal: current volume > 1.5x average = confirmation of price move

### 2. Signal Score
- Compute each indicator's directional signal: bullish (+1), bearish (-1), neutral (0)
- Rules:
  - RSI < 30 → bullish; RSI > 70 → bearish
  - MACD histogram > 0 and rising → bullish; < 0 and falling → bearish
  - Price > MA50 → bullish; Price < MA50 → bearish
  - Price near BB lower (within 2%) → bullish; near BB upper → bearish
  - Volume > 1.5x SMA → confirms direction (amplifies existing signal)
- Composite score: count of aligned signals (0-5)
  - 0-2: weak → skip LLM
  - 3+: strong → invoke LLM
- Also output: dominant direction (`'bullish' | 'bearish' | 'neutral'`)

### 3. Compute All Function
- `computeIndicators(history: OHLCV[], currentPrice: number): IndicatorResult`
- Returns all individual values + signal score + direction
  ```typescript
  type IndicatorResult = {
    rsi14: number | null;
    macd: { line: number; signal: number; histogram: number } | null;
    ma20: number | null;
    ma50: number | null;
    ma200: number | null;
    bollingerBands: { upper: number; middle: number; lower: number } | null;
    volumeSma20: number | null;
    signalScore: number; // 0-5
    direction: 'bullish' | 'bearish' | 'neutral';
    signals: SignalDetail[]; // which indicators fired and why
  };

  type SignalDetail = {
    indicator: string;
    signal: 'bullish' | 'bearish' | 'neutral';
    value: number;
    reason: string;
  };
  ```

### 4. Persistence
- After computation, save to `indicators` table
- Include signal_score for quick queries ("which tickers have strong signals right now?")

### 5. Edge Cases
- Not enough data (< 200 bars): compute what's possible, null the rest
  - RSI needs 14+ bars
  - MA200 needs 200+ bars
  - MACD needs 26+ bars
- All prices identical (zero movement): all indicators neutral, score = 0
- Volume = 0 (no trading): skip volume signal

## Technical Constraints

- Must be synchronous/instant (no API calls)
- Pure functions for testability
- No external TA library dependency — implement from scratch (simpler, no dep risk)
- Computation for 30 tickers should take < 100ms total

## Success Criteria

- RSI returns known values for known test data (verified against TradingView/external)
- MACD crossover correctly detected
- Signal score correctly counts aligned indicators
- Works with partial data (< 200 bars)
- All indicator functions have individual unit tests
- `computeIndicators` integration test with real historical data
- < 100ms for 30 tickers

## Non-Goals (for this spec)

- Advanced indicators (Ichimoku, Stochastic, ADX)
- Machine learning features
- Custom indicator periods (hardcoded for now)
- Real-time streaming computation
