import { describe, expect, it } from 'vitest';

import type { AgentDecision } from '@/lib/agent/types';

import type { PortfolioState } from '../types';
import { checkOperational } from './operational';

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

describe('operational rules', () => {
  it('should approve trade within daily limits', () => {
    const result = checkOperational(makeDecision(), makePortfolio(), 'Technology');
    expect(result.violations).toHaveLength(0);
  });

  it('should reject trade exceeding daily max', () => {
    const result = checkOperational(makeDecision(), makePortfolio({ dailyTradeCount: 3 }));
    expect(result.violations[0].rule).toBe('max_trades_per_day');
  });

  it('should reject buy exceeding same-sector daily limit', () => {
    const result = checkOperational(
      makeDecision(),
      makePortfolio({ todaySectorTrades: { Technology: 2 } }),
      'Technology',
    );
    expect(result.violations.some((v) => v.rule === 'max_sector_per_day')).toBe(true);
  });

  it('should reject buy during cooldown after sell', () => {
    const result = checkOperational(
      makeDecision({ ticker: 'AAPL' }),
      makePortfolio({ recentSells: [{ ticker: 'AAPL', timestamp: new Date(Date.now() - 60000) }] }),
    );
    expect(result.violations.some((v) => v.rule === 'sell_cooldown')).toBe(true);
  });

  it('should allow buy after cooldown expired', () => {
    const result = checkOperational(
      makeDecision({ ticker: 'AAPL' }),
      makePortfolio({
        recentSells: [{ ticker: 'AAPL', timestamp: new Date(Date.now() - 5 * 3600000) }],
      }),
    );
    expect(result.violations).toHaveLength(0);
  });

  it('should pass through hold decisions', () => {
    const result = checkOperational(
      makeDecision({ action: 'hold' }),
      makePortfolio({ dailyTradeCount: 5 }),
    );
    expect(result.violations).toHaveLength(0);
  });

  it('should not apply sector or cooldown rules to sells', () => {
    const result = checkOperational(
      makeDecision({ action: 'sell' }),
      makePortfolio({ todaySectorTrades: { Technology: 3 }, dailyTradeCount: 1 }),
      'Technology',
    );
    expect(result.violations).toHaveLength(0);
  });
});
