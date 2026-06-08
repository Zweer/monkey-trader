import { describe, expect, it } from 'vitest';

import { checkAutoTriggers } from '../triggers';
import type { Position } from '../types';

function makePosition(overrides: Partial<Position> = {}): Position {
  return {
    ticker: 'AAPL',
    type: 'stock',
    sector: 'Technology',
    shares: 10,
    avgEntryPrice: 100,
    currentPrice: 100,
    pnlPercent: 0,
    peakPrice: 100,
    portfolioPercent: 10,
    daysSinceEntry: 5,
    ...overrides,
  };
}

describe('checkAutoTriggers', () => {
  it('should generate no decisions for healthy positions', () => {
    const decisions = checkAutoTriggers([makePosition({ pnlPercent: 5 })]);
    expect(decisions).toHaveLength(0);
  });

  it('should generate full sell for stop loss', () => {
    const decisions = checkAutoTriggers([makePosition({ pnlPercent: -9, portfolioPercent: 10 })]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].action).toBe('sell');
    expect(decisions[0].sizePercent).toBe(10);
    expect(decisions[0].reasoning).toContain('stop_loss');
  });

  it('should generate half sell for take profit', () => {
    const decisions = checkAutoTriggers([
      makePosition({ pnlPercent: 16, peakPrice: 116, portfolioPercent: 12 }),
    ]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].sizePercent).toBe(6); // half of 12%
    expect(decisions[0].reasoning).toContain('take_profit');
  });

  it('should generate full sell for trailing stop', () => {
    // Peak +25%, current at +12% (dropped 10.4% from peak) — below take_profit threshold
    const decisions = checkAutoTriggers([
      makePosition({
        avgEntryPrice: 100,
        currentPrice: 112,
        peakPrice: 125,
        pnlPercent: 12,
        portfolioPercent: 15,
      }),
    ]);
    expect(decisions).toHaveLength(1);
    expect(decisions[0].sizePercent).toBe(15);
    expect(decisions[0].reasoning).toContain('trailing_stop');
  });

  it('should not generate decisions for flag_review only', () => {
    const decisions = checkAutoTriggers([makePosition({ daysSinceEntry: 15 })]);
    expect(decisions).toHaveLength(0);
  });

  it('should handle multiple triggered positions', () => {
    const positions = [
      makePosition({ ticker: 'AAPL', pnlPercent: -10, portfolioPercent: 8 }),
      makePosition({ ticker: 'BTC', pnlPercent: 17, peakPrice: 117, portfolioPercent: 12 }),
    ];
    const decisions = checkAutoTriggers(positions);
    expect(decisions).toHaveLength(2);
    expect(decisions[0].ticker).toBe('AAPL');
    expect(decisions[1].ticker).toBe('BTC');
  });
});
