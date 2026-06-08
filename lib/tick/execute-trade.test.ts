import { describe, expect, it } from 'vitest';

import type { AgentDecision } from '@/lib/agent/types';

import { type CashState, executeBuy, executeSell, type PositionState } from './execute-trade';

function makeDecision(overrides: Partial<AgentDecision> = {}): AgentDecision {
  return {
    action: 'buy',
    ticker: 'AAPL',
    sizePercent: 5,
    confidence: 0.7,
    reasoning: 'test',
    stopLossPercent: -8,
    targetPercent: 12,
    timeHorizon: '3 days',
    ...overrides,
  };
}

describe('executeBuy', () => {
  it('should buy new position', () => {
    const cash: CashState = { cash: 10000 };
    const result = executeBuy(makeDecision({ sizePercent: 10 }), 150, 10000, cash);

    expect(result.executed).toBe(true);
    expect(result.shares).toBeCloseTo(6.667, 2);
    expect(result.totalCost).toBe(1000);
    expect(cash.cash).toBe(9000);
  });

  it('should average into existing position', () => {
    const cash: CashState = { cash: 10000 };
    const position: PositionState = { ticker: 'AAPL', shares: 5, avgEntryPrice: 140 };
    const result = executeBuy(makeDecision({ sizePercent: 10 }), 160, 10000, cash, position);

    expect(result.executed).toBe(true);
    expect(position.shares).toBeCloseTo(11.25, 2);
    // avg = (140*5 + 160*6.25) / 11.25 = (700+1000)/11.25 ≈ 151.11
    expect(position.avgEntryPrice).toBeCloseTo(151.11, 1);
  });

  it('should reject if insufficient cash', () => {
    const cash: CashState = { cash: 100 };
    const result = executeBuy(makeDecision({ sizePercent: 10 }), 150, 10000, cash);

    expect(result.executed).toBe(false);
    expect(result.error).toContain('Insufficient');
    expect(cash.cash).toBe(100); // unchanged
  });
});

describe('executeSell', () => {
  it('should sell full position', () => {
    const cash: CashState = { cash: 5000 };
    const position: PositionState = { ticker: 'AAPL', shares: 10, avgEntryPrice: 140 };
    const result = executeSell(
      makeDecision({ action: 'sell', sizePercent: 15 }),
      150,
      10000,
      cash,
      position,
    );

    expect(result.executed).toBe(true);
    expect(result.shares).toBe(10); // capped to available shares
    expect(cash.cash).toBe(6500); // 5000 + 10*150
    expect(position.shares).toBe(0);
  });

  it('should partial sell', () => {
    const cash: CashState = { cash: 5000 };
    const position: PositionState = { ticker: 'AAPL', shares: 10, avgEntryPrice: 140 };
    const result = executeSell(
      makeDecision({ action: 'sell', sizePercent: 5 }),
      150,
      10000,
      cash,
      position,
    );

    expect(result.executed).toBe(true);
    // 5% of 10000 = 500, at $150 = 3.33 shares
    expect(result.shares).toBeCloseTo(3.33, 1);
    expect(position.shares).toBeCloseTo(6.67, 1);
    expect(cash.cash).toBeCloseTo(5500, 0);
  });
});
