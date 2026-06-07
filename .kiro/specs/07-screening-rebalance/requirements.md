# Spec 07 — Screening & Rebalance

## Vision

The tick loop handles individual ticker decisions. Screening and rebalancing handle the *portfolio-level* strategy: which titles to watch, and whether the overall allocation makes sense. Both use Gemini Pro for deeper reasoning.

## Goal

Two endpoints (`/api/screen` and `/api/rebalance`) that manage the watchlist and portfolio structure at a higher level than individual ticks.

## Requirements

### 1. Daily Screening (`POST /api/screen`)

#### Purpose
Select the 10-30 most interesting titles from a broader universe for the watchlist.

#### Universe
- **Stocks**: S&P 100 tickers (fixed list of ~100 blue chips)
- **Crypto**: Top 30 by market cap (fetch from Binance ticker list)
- Total scan: ~130 candidates

#### Screening Flow
```
1. Auth check
2. Fetch current prices + 24h change for all candidates (batch)
3. Quick filter: remove low-volume, stale, or blocked tickers
4. For remaining candidates: compute basic indicators (RSI, MA50 only — fast)
5. Build screening prompt for Gemini Pro with:
   - Top movers (biggest 24h change)
   - Oversold/overbought (RSI extremes)
   - Current watchlist (what we already monitor)
   - Current portfolio (what we already hold — don't drop those)
6. Gemini Pro selects 10-30 titles with reasoning
7. Update watchlist table (activate selected, deactivate others)
8. Return summary
```

#### Screening Prompt Context
- List of ~130 candidates with: ticker, name, sector, price, 24h change, RSI, MA50 position
- Current watchlist (what's already monitored)
- Current positions (MUST stay on watchlist — can't drop a held title)
- Instruction: select 10-30 titles with highest trading potential for the next 24h

#### Screening Output Schema
```typescript
type ScreeningResult = {
  selected: {
    ticker: string;
    reason: string; // one sentence
  }[];
  dropped: {
    ticker: string;
    reason: string;
  }[];
  summary: string; // 2-3 sentences on market outlook
};
```

#### Constraints
- Titles with open positions CANNOT be dropped from watchlist
- Minimum 5 stocks + 3 crypto always on watchlist
- Maximum 30 titles total (budget constraint for tick loop)

### 2. Weekly Rebalance (`POST /api/rebalance`)

#### Purpose
Review the entire portfolio structure, suggest closes/swaps/size changes.

#### Rebalance Flow
```
1. Auth check
2. Fetch current portfolio state + all position P&Ls
3. Fetch performance history (last 7 days)
4. Build rebalance prompt for Gemini Pro with:
   - Full portfolio breakdown (positions, entry, current, P&L, days held)
   - Sector allocation
   - Weekly performance vs benchmarks
   - Risk rule status (defensive mode? near limits?)
5. Gemini Pro suggests rebalance actions
6. Validate actions against risk rules
7. Execute approved actions (as synthetic decisions)
8. Return summary
```

#### Rebalance Prompt Context
- Full portfolio: every position with ticker, shares, entry price, current price, P&L%, days held, sector
- Cash balance and invested %
- Weekly performance: portfolio vs S&P 500 vs BTC hold
- Concentration risks: biggest positions, sector weights
- Stale positions: anything held > 14 days without significant movement

#### Rebalance Output Schema
```typescript
type RebalanceResult = {
  actions: {
    ticker: string;
    action: 'close' | 'reduce' | 'increase';
    sizePercent: number;
    reason: string;
  }[];
  portfolioAssessment: string; // 3-5 sentences
  riskLevel: 'low' | 'moderate' | 'high';
  suggestedCashTarget: number; // % to hold in cash
};
```

#### Constraints
- Maximum 5 rebalance actions per week (avoid overtrading)
- All actions go through risk engine (same rules apply)
- Rebalance cannot force-buy if in defensive mode

### 3. Universe Management

- `lib/screen/universe.ts`: static list of S&P 100 tickers + dynamic crypto top 30
- Crypto list: fetch from Binance `GET /api/v3/ticker/24hr`, sort by quote volume, take top 30
- S&P 100 list: hardcoded constant (updated manually if needed)
- Exclude: stablecoins (USDT, USDC, DAI), leveraged tokens, wrapped tokens

### 4. Shared Response Shape
Both endpoints return:
```json
{
  "status": "ok",
  "timestamp": "ISO8601",
  "model": "pro",
  "tokensUsed": { "input": 5000, "output": 800 },
  "durationMs": 12000,
  "result": { ... }
}
```

## Technical Constraints

- Screening scans 130 tickers — price fetch must be batched (< 10s)
- Single Gemini Pro call per endpoint (keep costs low)
- Prompt must be < 8000 tokens (Pro context is large but we want efficiency)
- Both endpoints must complete within 60s
- Run at off-peak times (screen at 09:00 UTC, rebalance Sunday 20:00 UTC)

## Success Criteria

- Screening selects 10-30 titles from 130 candidates
- Held positions never dropped from watchlist
- Rebalance produces actionable suggestions within risk rules
- Both endpoints complete within 60s
- Invalid Pro output handled (retry + fallback to no changes)
- Watchlist transitions are logged (what was added/removed and why)
- Tests with mocked Gemini Pro responses

## Non-Goals (for this spec)

- Real-time news/sentiment analysis for screening
- User-defined screening criteria
- Backtesting screening performance
- Multiple screening sources (only Alpaca + Binance)
