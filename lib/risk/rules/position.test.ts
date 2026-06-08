import { describe, expect, it } from 'vitest';

import type { Position } from '../types';
import { checkPositionRules } from './position';

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

describe('checkPositionRules', () => {
  it('should return no triggers for healthy position', () => {
    const triggers = checkPositionRules([makePosition({ pnlPercent: 5 })]);
    expect(triggers).toHaveLength(0);
  });

  it('should trigger stop loss at -8%', () => {
    const triggers = checkPositionRules([makePosition({ pnlPercent: -8 })]);
    expect(triggers).toHaveLength(1);
    expect(triggers[0].rule).toBe('stop_loss');
    expect(triggers[0].action).toBe('sell_all');
  });

  it('should trigger stop loss at worse than -8%', () => {
    const triggers = checkPositionRules([makePosition({ pnlPercent: -12 })]);
    expect(triggers[0].rule).toBe('stop_loss');
  });

  it('should trigger take profit at +15%', () => {
    const triggers = checkPositionRules([makePosition({ pnlPercent: 15, peakPrice: 115 })]);
    expect(triggers).toHaveLength(1);
    expect(triggers[0].rule).toBe('take_profit');
    expect(triggers[0].action).toBe('sell_half');
  });

  it('should trigger trailing stop (peak +20%, drop 5% from peak)', () => {
    // Entry 100, peak 125 (+25%), current 118 (drop 5.6% from peak)
    const triggers = checkPositionRules([
      makePosition({ avgEntryPrice: 100, currentPrice: 118, peakPrice: 125, pnlPercent: 18 }),
    ]);
    expect(triggers.some((t) => t.rule === 'trailing_stop')).toBe(true);
  });

  it('should not trigger trailing stop if peak < +20%', () => {
    // Entry 100, peak 115 (+15%), current 110
    const triggers = checkPositionRules([
      makePosition({ avgEntryPrice: 100, currentPrice: 110, peakPrice: 115, pnlPercent: 10 }),
    ]);
    expect(triggers.some((t) => t.rule === 'trailing_stop')).toBe(false);
  });

  it('should not trigger trailing stop if drop < 5% from peak', () => {
    // Entry 100, peak 125 (+25%), current 123 (drop 1.6% from peak)
    const triggers = checkPositionRules([
      makePosition({ avgEntryPrice: 100, currentPrice: 123, peakPrice: 125, pnlPercent: 23 }),
    ]);
    expect(triggers.some((t) => t.rule === 'trailing_stop')).toBe(false);
  });

  it('should flag for review after 14 days', () => {
    const triggers = checkPositionRules([makePosition({ daysSinceEntry: 15 })]);
    expect(triggers).toHaveLength(1);
    expect(triggers[0].rule).toBe('max_hold');
    expect(triggers[0].action).toBe('flag_review');
  });

  it('should handle multiple positions with different triggers', () => {
    const positions = [
      makePosition({ ticker: 'AAPL', pnlPercent: -9 }),
      makePosition({ ticker: 'BTC', pnlPercent: 16, peakPrice: 116 }),
      makePosition({ ticker: 'MSFT', pnlPercent: 3 }),
    ];
    const triggers = checkPositionRules(positions);
    expect(triggers).toHaveLength(2);
    expect(triggers[0].ticker).toBe('AAPL');
    expect(triggers[1].ticker).toBe('BTC');
  });
});
