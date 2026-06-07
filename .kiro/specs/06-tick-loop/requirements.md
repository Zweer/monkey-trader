# Spec 06 — Core Tick Loop (/api/tick)

## Vision

`/api/tick` is the heartbeat of MonkeyTrader. Every 30 minutes, it wakes up, processes all watched titles, makes decisions where needed, and goes back to sleep. It orchestrates all other modules (data, indicators, agent, risk) within Vercel's 60-second limit.

## Goal

A single endpoint that runs the full trading cycle: fetch prices → compute indicators → evaluate signals → invoke LLM if needed → apply risk rules → execute trades → update portfolio → save everything.

## Requirements

### 1. Endpoint Contract
- Route: `POST /api/tick`
- Auth: Bearer token (TICK_SECRET)
- Response (on success):
  ```json
  {
    "status": "ok",
    "tickId": "uuid",
    "timestamp": "ISO8601",
    "processed": 30,
    "signalsStrong": 5,
    "decisionsGenerated": 3,
    "tradesExecuted": 2,
    "autoTriggers": 1,
    "durationMs": 34521
  }
  ```
- Response (on partial failure): same shape, includes `warnings: string[]`
- Must return within 60s (Vercel hard limit)

### 2. Tick Flow (Orchestration)

```
1. Auth check
2. Load watchlist (active tickers)
3. Fetch prices for all tickers (parallel: stocks + crypto)
4. Save price snapshots
5. For each ticker:
   a. Fetch history (from DB cache or API)
   b. Compute indicators
   c. Save indicators
   d. Evaluate signal score
6. Check auto-triggers (stop loss, trailing stop, take profit) on all positions
7. Execute auto-triggers (bypass LLM)
8. For tickers with signal score >= 3:
   a. Build agent context
   b. Call Gemini (Flash or Pro based on routing)
   c. Validate decision
   d. Apply risk check
   e. If approved: execute trade (update portfolio)
   f. Save decision
9. Update portfolio state (total value, performance)
10. Return summary
```

### 3. Time Budget Management
- Total budget: 55s (leave 5s margin)
- Phase allocation:
  - Price fetch: max 15s
  - Indicators computation: < 1s
  - Auto-triggers: < 1s
  - LLM decisions (serial): max 30s (up to 5 calls × 5s each for Flash)
  - DB writes: max 5s
- If approaching timeout:
  - Skip remaining LLM calls
  - Save what's computed so far
  - Return partial result with warning

### 4. Trade Execution (Paper)
- Simulate trade execution:
  - Buy: reduce cash, add/increase position
  - Sell: increase cash, reduce/remove position
  - Partial sell: reduce position by specified %
- All in DB — no real broker interaction
- Atomic: position update + cash update in single transaction
- Record execution price = current market price at decision time

### 5. Portfolio Update
- After all trades, recalculate:
  - Total portfolio value (cash + sum of position values)
  - Each position's current value and P&L
  - Daily performance entry (if not already recorded today)
- Update `portfolio_state` table
- Update `performance` table (daily row)

### 6. Adaptive Behavior
- If zero strong signals and no auto-triggers: tick completes in ~15s (fast path)
- If many strong signals: process up to 5 LLM calls per tick (cap to stay in budget)
- Priority: auto-triggers first (risk protection), then strongest signals first

### 7. Idempotency
- Each tick generates a unique `tickId` (UUID)
- If same tick fires twice (GitHub Actions retry), check for existing tick in last 5 minutes
- If recent tick exists and completed successfully → return early with cached result
- Prevent duplicate trades from double-fires

### 8. Logging
- Structured logs for each phase (for debugging in Vercel dashboard):
  - `[TICK] started: {tickId}`
  - `[FETCH] {N} prices fetched in {ms}ms`
  - `[SIGNAL] {ticker} score={score} direction={dir}`
  - `[AGENT] {ticker} → {action} confidence={conf}`
  - `[RISK] {ticker} → {verdict} {reason}`
  - `[TRADE] {action} {ticker} {size}% at ${price}`
  - `[TICK] completed in {ms}ms`

## Technical Constraints

- 60s hard limit (Vercel)
- No background jobs (function dies after response)
- Serial LLM calls (parallel would exceed Gemini rate limits)
- Must save state even on timeout (partial writes acceptable)
- Cold starts add ~2-3s (first tick after idle may be slower)

## Success Criteria

- Full tick completes in < 55s for 30 tickers
- Fast path (no signals) completes in < 15s
- Auto-triggers fire before LLM decisions
- Portfolio math is correct (no phantom money)
- Duplicate tick detection works
- Partial failure doesn't corrupt portfolio state
- Tests: mock all externals, verify orchestration order and state changes

## Non-Goals (for this spec)

- Adaptive frequency (always every 30 min for now)
- Webhook notification on trades
- Tick scheduling logic (that's GitHub Actions' job)
- Parallel LLM calls
