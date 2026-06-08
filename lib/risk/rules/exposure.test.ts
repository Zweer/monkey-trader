import { describe, expect, it } from 'vitest';

import type { AgentDecision } from '@/lib/agent/types';

import type { PortfolioState } from '../types';
import { checkExposure } from './exposure';

function makePortfolio(overrides: Partial<PortfolioState> = {}): PortfolioState {
  return {
    cash: 5000,
    totalValue: 10000,
    investedPercent: 50,
    positions: [],
    dailyTradeCount: 0,
    todaySectorTrades: {},
    recentSells: [],
    weeklyPerformance: 0,
    isDefensiveMode: false,
    ...overrides,
  };
}

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

describe('exposure rules', () => {
  it('should approve buy within exposure limits', () => {
    const result = checkExposure(makeDecision(), makePortfolio());
    expect(result.violations).toHaveLength(0);
    expect(result.adjustedSize).toBe(5);
  });

  it('should downsize buy to maintain 30% cash', () => {
    const result = checkExposure(
      makeDecision({ sizePercent: 15 }),
      makePortfolio({ investedPercent: 60 }),
    );
    expect(result.adjustedSize).toBe(10); // 70 - 60 = 10
    expect(result.violations[0].rule).toBe('max_invested');
    expect(result.violations[0].severity).toBe('soft');
  });

  it('should reject buy if no room for min position', () => {
    const result = checkExposure(makeDecision(), makePortfolio({ investedPercent: 69 }));
    expect(result.violations[0].rule).toBe('max_invested');
    expect(result.violations[0].severity).toBe('hard');
  });

  it('should reject all buys in defensive mode', () => {
    const result = checkExposure(
      makeDecision(),
      makePortfolio({ isDefensiveMode: true, weeklyPerformance: -12 }),
    );
    expect(result.violations[0].rule).toBe('defensive_mode');
    expect(result.violations[0].severity).toBe('hard');
  });

  it('should pass through sell decisions', () => {
    const result = checkExposure(makeDecision({ action: 'sell' }), makePortfolio());
    expect(result.violations).toHaveLength(0);
  });

  it('should pass through hold decisions', () => {
    const result = checkExposure(makeDecision({ action: 'hold' }), makePortfolio());
    expect(result.violations).toHaveLength(0);
  });
});
