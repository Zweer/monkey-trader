import { describe, expect, it } from 'vitest';

import type { AgentDecision } from '@/lib/agent/types';

import type { PortfolioState } from '../types';
import { checkAllocation } from './allocation';

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

describe('allocation rules', () => {
  it('should approve valid buy within limits', () => {
    const result = checkAllocation(makeDecision(), makePortfolio());
    expect(result.violations).toHaveLength(0);
    expect(result.adjustedSize).toBe(5);
  });

  it('should reject buy below minimum position size', () => {
    const result = checkAllocation(makeDecision({ sizePercent: 2 }), makePortfolio());
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].rule).toBe('min_position_size');
    expect(result.violations[0].severity).toBe('hard');
  });

  it('should downsize buy exceeding max single position', () => {
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
          portfolioPercent: 15,
          daysSinceEntry: 5,
        },
      ],
    });
    const result = checkAllocation(makeDecision({ sizePercent: 10 }), portfolio);
    expect(result.adjustedSize).toBe(5); // 20 - 15 = 5
    expect(result.violations[0].rule).toBe('max_single_position');
    expect(result.violations[0].severity).toBe('soft');
  });

  it('should hard reject if position already at max', () => {
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
          portfolioPercent: 19,
          daysSinceEntry: 5,
        },
      ],
    });
    const result = checkAllocation(makeDecision({ sizePercent: 5 }), portfolio);
    expect(
      result.violations.some((v) => v.rule === 'max_single_position' && v.severity === 'hard'),
    ).toBe(true);
  });

  it('should reject buy exceeding max sector', () => {
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
          portfolioPercent: 38,
          daysSinceEntry: 5,
        },
      ],
    });
    const result = checkAllocation(makeDecision({ sizePercent: 5 }), portfolio);
    expect(result.violations.some((v) => v.rule === 'max_sector')).toBe(true);
  });

  it('should reject sell of safe asset below minimum safe threshold', () => {
    const portfolio = makePortfolio({
      positions: [
        {
          ticker: 'BTC',
          type: 'crypto',
          sector: 'crypto',
          shares: 1,
          avgEntryPrice: 60000,
          currentPrice: 67000,
          pnlPercent: 10,
          peakPrice: 68000,
          portfolioPercent: 32,
          daysSinceEntry: 10,
        },
      ],
    });
    const result = checkAllocation(
      makeDecision({ action: 'sell', ticker: 'BTC', sizePercent: 5 }),
      portfolio,
    );
    expect(result.violations.some((v) => v.rule === 'min_safe_assets')).toBe(true);
  });

  it('should reject speculative buy exceeding limit', () => {
    const portfolio = makePortfolio({
      positions: [
        {
          ticker: 'DOGE',
          type: 'crypto',
          sector: 'crypto',
          shares: 1000,
          avgEntryPrice: 0.1,
          currentPrice: 0.1,
          pnlPercent: 0,
          peakPrice: 0.12,
          portfolioPercent: 28,
          daysSinceEntry: 3,
        },
      ],
    });
    const result = checkAllocation(makeDecision({ ticker: 'SOL', sizePercent: 5 }), portfolio);
    expect(result.violations.some((v) => v.rule === 'max_speculative')).toBe(true);
  });

  it('should pass through hold decisions', () => {
    const result = checkAllocation(makeDecision({ action: 'hold' }), makePortfolio());
    expect(result.violations).toHaveLength(0);
    expect(result.adjustedSize).toBe(0);
  });
});
