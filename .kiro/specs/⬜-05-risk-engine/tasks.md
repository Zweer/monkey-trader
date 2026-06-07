# Spec 05 — Risk Management Tasks

## Dependency Order

```
T1 (Constants + Types) → T2 (Allocation Rules) → T3 (Position Rules) → T4 (Exposure Rules) → T5 (Operational Rules) → T6 (Auto Triggers) → T7 (Orchestrator)
```

## T1 — Constants & Types

- [ ] Create `lib/risk/constants.ts`: all thresholds as named constants
- [ ] Create `lib/risk/types.ts`: `RiskVerdict`, `RiskViolation`, `PortfolioState`, `Position`
- [ ] Create `lib/risk/portfolio-state.ts`: `getPortfolioState(): Promise<PortfolioState>` (queries DB)
- [ ] Test: portfolio state correctly computes `investedPercent`, `isDefensiveMode`

**Acceptance:** Types compile, constants are clear and documented, portfolio state aggregation correct.

## T2 — Allocation Rules

- [ ] Create `lib/risk/rules/allocation.ts`
- [ ] Rule: max 20% single position → downsize if exceeded
- [ ] Rule: max 40% single sector → reject if exceeded
- [ ] Rule: min 30% safe assets → reject sell of safe if would violate
- [ ] Rule: max 30% speculative → reject buy of speculative if exceeded
- [ ] Rule: min 3% position size → reject dust positions
- [ ] Tests: each rule with boundary cases (exactly at limit, 1% over, etc.)

**Acceptance:** All allocation rules fire correctly at their thresholds.

## T3 — Position Rules

- [ ] Create `lib/risk/rules/position.ts`
- [ ] Rule: stop loss at -8% → force sell
- [ ] Rule: take profit at +15% → partial sell (50%)
- [ ] Rule: trailing stop (peak +20%, drop 5% from peak) → full sell
- [ ] Rule: max hold 14 days → flag for review
- [ ] Tests: simulate position at various P&L levels, verify triggers

**Acceptance:** Stop loss, take profit, trailing stop all trigger at correct thresholds.

## T4 — Exposure Rules

- [ ] Create `lib/risk/rules/exposure.ts`
- [ ] Rule: max 70% invested → downsize buy to maintain 30% cash
- [ ] Rule: defensive mode (10% weekly drawdown) → reject all buys
- [ ] Tests: portfolio at 68% invested buying 5% → downsized to 2%; defensive mode blocks buys

**Acceptance:** Cash minimum enforced. Defensive mode activates/deactivates correctly.

## T5 — Operational Rules

- [ ] Create `lib/risk/rules/operational.ts`
- [ ] Rule: max 3 trades/day → reject after limit (except stop-loss)
- [ ] Rule: max 2 same-sector opens per day → reject
- [ ] Rule: 4h cooldown after selling → reject re-buy
- [ ] Tests: simulate multiple trades, verify limits enforced

**Acceptance:** Daily limits, sector correlation, and cooldown all enforced.

## T6 — Automatic Triggers

- [ ] Create `lib/risk/triggers.ts`
- [ ] Implement `checkAutoTriggers(positions: Position[]): AgentDecision[]`
- [ ] Scan all positions for: stop loss hit, take profit threshold, trailing stop
- [ ] Generate synthetic decisions with `reasoning: "Risk rule: ..."`
- [ ] Tests: position at -9% generates sell, position at +16% generates partial sell

**Acceptance:** Auto-triggers generate correct decisions without LLM involvement.

## T7 — Risk Orchestrator

- [ ] Create `lib/risk/index.ts`
- [ ] Implement `checkRisk(decision: AgentDecision, portfolio: PortfolioState): RiskVerdict`
- [ ] Run all rule modules in sequence, collect violations
- [ ] Hard violations → reject; soft violations → downsize
- [ ] Integration test: full decision flow through all rules

**Acceptance:** Orchestrator correctly chains rules, produces final verdict with all violations listed.
