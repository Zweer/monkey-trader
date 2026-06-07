# Spec 06 — Core Tick Loop Tasks

## Dependency Order

```
T1 (Tick Orchestrator) → T2 (Trade Execution) → T3 (Portfolio Update) → T4 (Idempotency) → T5 (Time Budget) → T6 (Integration Test)
```

## T1 — Tick Orchestrator

- [ ] Create `lib/tick/index.ts`
- [ ] Implement `runTick(): Promise<TickResult>`
- [ ] Orchestration flow: auth → watchlist → fetch → indicators → auto-triggers → LLM → risk → trades → portfolio
- [ ] Generate unique `tickId` per execution
- [ ] Structured logging at each phase
- [ ] Update `app/api/tick/route.ts` to call `runTick()` instead of stub
- [ ] Test: mock all dependencies, verify correct call order

**Acceptance:** Orchestrator calls each module in correct order, returns summary.

## T2 — Trade Execution

- [ ] Create `lib/tick/execute-trade.ts`
- [ ] Implement `executeTrade(decision: ApprovedDecision, portfolio: PortfolioState): Promise<TradeResult>`
- [ ] Buy: deduct cash, upsert position (average entry price if adding)
- [ ] Sell: add cash, reduce/remove position
- [ ] Partial sell: reduce shares by specified %
- [ ] Atomic DB transaction (position + cash in one query)
- [ ] Test: buy new, buy existing (average), sell all, partial sell, insufficient cash

**Acceptance:** Portfolio state correctly updated after each trade type. No negative cash possible.

## T3 — Portfolio Update

- [ ] Create `lib/tick/portfolio-update.ts`
- [ ] Implement `updatePortfolioState(positions: Position[], cash: number): Promise<void>`
- [ ] Recalculate total value, per-position P&L
- [ ] Update `portfolio_state` row
- [ ] Upsert daily `performance` row (create or update if same day)
- [ ] Test: verify correct math for mixed portfolio

**Acceptance:** Portfolio value = cash + sum(shares × current price). Daily P&L correct.

## T4 — Idempotency Guard

- [ ] Create `lib/tick/idempotency.ts`
- [ ] Implement `checkRecentTick(): Promise<TickResult | null>`
- [ ] Query: any completed tick in last 5 minutes?
- [ ] If yes → return cached result, skip processing
- [ ] Store tick results with tickId and timestamp
- [ ] Test: duplicate call within 5min returns cached, call after 5min processes normally

**Acceptance:** Double-fired GitHub Actions don't create duplicate trades.

## T5 — Time Budget Manager

- [ ] Create `lib/tick/budget.ts`
- [ ] Implement `TimeBudget` class: `start()`, `elapsed()`, `remaining()`, `canProceed(estimatedMs: number): boolean`
- [ ] Hard limit: 55000ms
- [ ] Before each LLM call: check if enough time remains
- [ ] If budget exhausted: skip remaining LLM calls, save partial results
- [ ] Test: simulate slow LLM, verify graceful cutoff

**Acceptance:** Tick never exceeds 55s. Partial results saved on timeout.

## T6 — Integration Test

- [ ] Create `lib/tick/tick.test.ts`
- [ ] Full tick flow with all dependencies mocked
- [ ] Scenario 1: no strong signals → fast path, no LLM calls
- [ ] Scenario 2: 3 strong signals → 3 LLM calls, 2 approved, 1 rejected by risk
- [ ] Scenario 3: stop loss triggered → auto-sell before LLM
- [ ] Scenario 4: time budget exceeded → partial result returned
- [ ] Scenario 5: duplicate tick → cached result returned

**Acceptance:** All scenarios produce correct results with proper state transitions.
