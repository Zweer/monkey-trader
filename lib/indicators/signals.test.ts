import { describe, expect, it } from 'vitest';

import { evaluateSignals } from './signals';
import type { IndicatorResult } from './types';

function makeIndicators(overrides: Partial<IndicatorResult> = {}): IndicatorResult {
  return {
    rsi14: null,
    macd: null,
    ma20: null,
    ma50: null,
    ma200: null,
    bollingerBands: null,
    volumeSma20: null,
    signalScore: 0,
    direction: 'neutral',
    signals: [],
    ...overrides,
  };
}

describe('evaluateSignals', () => {
  it('should return score 0 for neutral indicators', () => {
    const result = evaluateSignals(makeIndicators(), 100, 1000);
    expect(result.score).toBe(0);
    expect(result.direction).toBe('neutral');
    expect(result.signals).toHaveLength(0);
  });

  it('should detect bullish RSI (oversold)', () => {
    const result = evaluateSignals(makeIndicators({ rsi14: 25 }), 100, 1000);
    expect(result.signals[0].signal).toBe('bullish');
    expect(result.signals[0].indicator).toBe('RSI');
  });

  it('should detect bearish RSI (overbought)', () => {
    const result = evaluateSignals(makeIndicators({ rsi14: 75 }), 100, 1000);
    expect(result.signals[0].signal).toBe('bearish');
  });

  it('should detect bullish MACD', () => {
    const result = evaluateSignals(
      makeIndicators({ macd: { line: 2, signal: 1, histogram: 1 } }),
      100,
      1000,
    );
    expect(result.signals[0].signal).toBe('bullish');
    expect(result.signals[0].indicator).toBe('MACD');
  });

  it('should detect price above MA50 as bullish', () => {
    const result = evaluateSignals(makeIndicators({ ma50: 90 }), 100, 1000);
    expect(result.signals[0].signal).toBe('bullish');
  });

  it('should detect price below MA50 as bearish', () => {
    const result = evaluateSignals(makeIndicators({ ma50: 110 }), 100, 1000);
    expect(result.signals[0].signal).toBe('bearish');
  });

  it('should detect price near lower BB as bullish', () => {
    const result = evaluateSignals(
      makeIndicators({ bollingerBands: { upper: 120, middle: 100, lower: 80 } }),
      80.5, // very close to lower band
      1000,
    );
    const bbSignal = result.signals.find((s) => s.indicator === 'BB');
    expect(bbSignal?.signal).toBe('bullish');
  });

  it('should add volume confirmation when volume > 1.5x avg', () => {
    const indicators = makeIndicators({
      rsi14: 25,
      macd: { line: 2, signal: 1, histogram: 1 },
      volumeSma20: 1000,
    });
    const result = evaluateSignals(indicators, 100, 2000); // 2x volume
    const volSignal = result.signals.find((s) => s.indicator === 'Volume');
    expect(volSignal?.signal).toBe('bullish');
  });

  it('should return high score for multiple aligned bullish signals', () => {
    const indicators = makeIndicators({
      rsi14: 25,
      macd: { line: 2, signal: 1, histogram: 1 },
      ma50: 90,
      bollingerBands: { upper: 120, middle: 100, lower: 99.5 },
      volumeSma20: 1000,
    });
    const result = evaluateSignals(indicators, 99.7, 2000);
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.direction).toBe('bullish');
  });

  it('should return high score for multiple aligned bearish signals', () => {
    const indicators = makeIndicators({
      rsi14: 80,
      macd: { line: -2, signal: -1, histogram: -1 },
      ma50: 110,
      bollingerBands: { upper: 100.5, middle: 90, lower: 80 },
      volumeSma20: 1000,
    });
    const result = evaluateSignals(indicators, 100.3, 2000);
    expect(result.score).toBeGreaterThanOrEqual(4);
    expect(result.direction).toBe('bearish');
  });

  it('should cap score at 5', () => {
    const indicators = makeIndicators({
      rsi14: 25,
      macd: { line: 2, signal: 1, histogram: 1 },
      ma50: 90,
      bollingerBands: { upper: 120, middle: 100, lower: 99.5 },
      volumeSma20: 1000,
    });
    const result = evaluateSignals(indicators, 99.7, 2000);
    expect(result.score).toBeLessThanOrEqual(5);
  });
});
