import { describe, expect, it } from 'vitest';

import type { AgentDecision } from '@/lib/agent/types';

import { checkRisk } from './index';
import type { PortfolioState } from './types';

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

describe('checkRisk', () => {
  it('should approve valid buy within all limits', () => {
    const verdict = checkRisk(makeDecision(), makePortfolio());
    expect(verdict.approved).toBe(true);
    expect(verdict.action).toBe('approved');
    expect(verdict.adjustedSize).toBe(5);
  });

  it('should always approve hold', () => {
    const verdict = checkRisk(
      makeDecision({ action: 'hold' }),
      makePortfolio({ dailyTradeCount: 5 }),
    );
    expect(verdict.approved).toBe(true);
  });

  it('should reject when hard violation present', () => {
    // dust position < 3%
    const verdict = checkRisk(makeDecision({ sizePercent: 2 }), makePortfolio());
    expect(verdict.approved).toBe(false);
    expect(verdict.action).toBe('rejected');
  });

  it('should downsize when soft violation present', () => {
    const portfolio = makePortfolio({
      positions: [
        {
          ticker: 'AAPL',
          type: 'stock',
          sector: 'Technology',
          shares: 10,
          avgEntryPrice: 150,
          currentPrice: 150,
          pnlPercent: 0,
          peakPrice: 155,
          portfolioPercent: 16,
          daysSinceEntry: 5,
        },
      ],
    });
    // Buy 10% would bring AAPL to 26%, downsized to 4% (20 - 16)
    const verdict = checkRisk(makeDecision({ sizePercent: 10 }), portfolio);
    expect(verdict.approved).toBe(true);
    expect(verdict.action).toBe('downsized');
    expect(verdict.adjustedSize).toBe(4);
  });

  it('should reject in defensive mode', () => {
    const verdict = checkRisk(
      makeDecision(),
      makePortfolio({ isDefensiveMode: true, weeklyPerformance: -12 }),
    );
    expect(verdict.approved).toBe(false);
    expect(verdict.reason).toContain('no new buys');
  });

  it('should reject when max trades exceeded', () => {
    const verdict = checkRisk(makeDecision(), makePortfolio({ dailyTradeCount: 3 }));
    expect(verdict.approved).toBe(false);
    expect(verdict.violations.some((v) => v.rule === 'max_trades_per_day')).toBe(true);
  });

  it('should combine multiple rule violations', () => {
    const verdict = checkRisk(
      makeDecision({ sizePercent: 2 }),
      makePortfolio({ dailyTradeCount: 3 }),
    );
    expect(verdict.approved).toBe(false);
    expect(verdict.violations.length).toBeGreaterThan(1);
  });

  it('should approve sell even in defensive mode', () => {
    const portfolio = makePortfolio({
      isDefensiveMode: true,
      weeklyPerformance: -12,
      positions: [
        {
          ticker: 'DOGE',
          type: 'crypto',
          sector: 'crypto',
          shares: 1000,
          avgEntryPrice: 0.15,
          currentPrice: 0.14,
          pnlPercent: -7,
          peakPrice: 0.16,
          portfolioPercent: 14,
          daysSinceEntry: 5,
        },
      ],
    });
    const verdict = checkRisk(
      makeDecision({ action: 'sell', ticker: 'DOGE', sizePercent: 14 }),
      portfolio,
    );
    expect(verdict.approved).toBe(true);
  });
});
