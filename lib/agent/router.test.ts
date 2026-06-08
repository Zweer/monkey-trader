import { describe, expect, it } from 'vitest';

import { selectModel } from './router';
import type { TickContext } from './types';

function makeContext(overrides: Partial<TickContext> = {}): TickContext {
  return {
    ticker: 'AAPL',
    currentPrice: 150,
    change24h: 1.5,
    indicators: {
      rsi14: 50,
      macd: null,
      ma20: null,
      ma50: null,
      ma200: null,
      bollingerBands: null,
      volumeSma20: null,
      signalScore: 3,
      direction: 'bullish',
      signals: [],
    },
    portfolio: { cash: 7000, totalValue: 10000, positions: [] },
    recentDecisions: [],
    taskType: 'tick',
    ...overrides,
  };
}

describe('selectModel', () => {
  it('should return flash for routine tick with moderate signals', () => {
    expect(selectModel(makeContext())).toBe('flash');
  });

  it('should return pro for screening', () => {
    expect(selectModel(makeContext({ taskType: 'screen' }))).toBe('pro');
  });

  it('should return pro for rebalance', () => {
    expect(selectModel(makeContext({ taskType: 'rebalance' }))).toBe('pro');
  });

  it('should return pro for high volatility (>5% daily change)', () => {
    expect(selectModel(makeContext({ change24h: 7.2 }))).toBe('pro');
    expect(selectModel(makeContext({ change24h: -6.0 }))).toBe('pro');
  });

  it('should return pro for max signal score with recent decisions', () => {
    const ctx = makeContext({
      indicators: {
        rsi14: 25,
        macd: null,
        ma20: null,
        ma50: null,
        ma200: null,
        bollingerBands: null,
        volumeSma20: null,
        signalScore: 5,
        direction: 'bullish',
        signals: [],
      },
      recentDecisions: [
        { action: 'sell', ticker: 'AAPL', timestamp: new Date(), reasoning: 'test' },
      ],
    });
    expect(selectModel(ctx)).toBe('pro');
  });

  it('should return flash for score 5 without recent decisions', () => {
    const ctx = makeContext({
      indicators: {
        rsi14: 25,
        macd: null,
        ma20: null,
        ma50: null,
        ma200: null,
        bollingerBands: null,
        volumeSma20: null,
        signalScore: 5,
        direction: 'bullish',
        signals: [],
      },
    });
    expect(selectModel(ctx)).toBe('flash');
  });

  it('should return flash for low volatility tick', () => {
    expect(selectModel(makeContext({ change24h: 0.3 }))).toBe('flash');
  });
});
