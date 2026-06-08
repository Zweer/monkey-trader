# Spec 05 — Risk Management Engine

## Vision

Risk rules are the "immune system" of MonkeyTrader. They are enforced in code, NEVER by the LLM. Even if the agent outputs a perfect-looking decision, risk rules can veto or modify it. This is the last gate before any trade is recorded.

## Goal

A deterministic risk engine that validates every agent decision against hard portfolio constraints, position limits, and exposure rules. It can approve, reject, or downsize a trade.

## Requirements

### 1. Risk Check Function
- `checkRisk(decision: AgentDecision, portfolio: PortfolioState): RiskVerdict`
- Runs synchronously (no API calls)
- Returns:
  ```typescript
  type RiskVerdict = {
    approved: boolean;
    action: 'approved' | 'rejected' | 'downsized';
    originalSize: number;
    adjustedSize: number;  // may be reduced
    violations: RiskViolation[];
    reason: string;
  };

  type RiskViolation = {
    rule: string;
    description: string;
    severity: 'hard' | 'soft';  // hard = veto, soft = downsize
  };
  ```

### 2. Allocation Limits
- Max **20%** of portfolio on any single title
  - If decision would exceed → downsize to fit
- Max **40%** on any single sector/category
  - If decision would exceed → reject
- Min **30%** in "safe" assets (BTC/ETH for crypto, blue chips for stocks)
  - If selling a safe asset would go below → reject the sell
- Max **30%** in speculative positions (small cap, altcoins)
  - If buying speculative would exceed → reject

### 3. Position Rules
- **Stop loss**: if any position is at -8% from entry → auto-sell (force decision)
  - This can override the agent's hold/buy recommendation
- **Take profit (partial)**: if position at +15% → sell half
  - Triggered automatically, not by agent
- **Trailing stop**: if position reached +20% peak, then drops 5% from peak → sell all
  - Requires tracking per-position peak price
- **Max hold without review**: if position held > 14 days without Pro review → flag for review
- **Minimum position size**: 3% of portfolio
  - If decision is < 3% → reject (no dust positions)

### 4. Exposure Rules
- Max **70%** invested at any time, min **30%** cash
  - If buy would push invested > 70% → downsize to maintain 30% cash
- **Defensive mode**: if portfolio dropped 10% in the last 7 days
  - Only hold/sell allowed, no new buys
  - Auto-activates and deactivates based on rolling 7-day performance

### 5. Operational Rules
- Max **3 trades per day** (count from `decisions` table for today)
  - If at limit → reject any non-stop-loss trade
- **No excessive correlation**: can't open more than 2 positions in same sector in one day
- **Cooldown**: after selling a position, can't re-buy same ticker for 4 hours

### 6. Automatic Triggers
Some actions are triggered by the risk engine itself (not by agent decision):
- Stop loss hit → generate sell decision automatically
- Take profit threshold → generate partial sell
- Trailing stop triggered → generate full sell
- These are saved as decisions with `reasoning: "Risk rule: [rule name]"`

### 7. Portfolio State Helper
- `getPortfolioState(): Promise<PortfolioState>`
- Returns:
  ```typescript
  type PortfolioState = {
    cash: number;
    totalValue: number;
    investedPercent: number;
    positions: Position[];
    dailyTradeCount: number;
    weeklyPerformance: number; // % change last 7 days
    isDefensiveMode: boolean;
  };

  type Position = {
    ticker: string;
    type: 'stock' | 'crypto';
    sector: string;
    shares: number;
    avgEntryPrice: number;
    currentPrice: number;
    pnlPercent: number;
    peakPrice: number;     // for trailing stop
    portfolioPercent: number;
    daysSinceEntry: number;
  };
  ```

## Technical Constraints

- Must be synchronous/deterministic (pure function except for portfolio state fetch)
- Must complete in < 50ms (just math + comparisons)
- Risk rules are NOT configurable by the LLM — hardcoded in source
- All thresholds as named constants at top of file (easy to tune later)

## Success Criteria

- Stop loss triggers correctly at -8%
- Allocation limit prevents single-position > 20%
- Cash minimum maintained (30% always liquid)
- Defensive mode activates on 10% weekly drawdown
- Max 3 trades/day enforced
- Trailing stop tracks peak correctly
- All rules have individual unit tests
- Edge cases: empty portfolio, single position at 100%, zero cash

## Non-Goals (for this spec)

- User-configurable risk parameters (hardcoded for now)
- Risk analytics/reporting dashboard
- Backtesting risk rules against historical data
- Machine-learned risk thresholds
