import { describe, expect, it } from 'vitest';

import type { OHLCV } from '@/lib/data/types';

import { computeIndicators } from './index';

function generateHistory(days: number, basePrice = 100, trend = 0): OHLCV[] {
  return Array.from({ length: days }, (_, i) => {
    const noise = Math.sin(i * 0.5) * 2;
    const price = basePrice + trend * i + noise;
    return {
      open: price - 0.5,
      high: price + 1,
      low: price - 1,
      close: price,
      volume: 1000000 + Math.random() * 500000,
      timestamp: new Date(Date.now() - (days - i) * 86400000),
    };
  });
}

describe('computeIndicators', () => {
  it('should return all nulls for insufficient data', () => {
    const history = generateHistory(10);
    const result = computeIndicators(history, 100, 1000000);

    expect(result.rsi14).toBeNull();
    expect(result.macd).toBeNull();
    expect(result.ma50).toBeNull();
    expect(result.ma200).toBeNull();
    expect(result.signalScore).toBe(0);
  });

  it('should compute partial results with 50 bars', () => {
    const history = generateHistory(50);
    const result = computeIndicators(history, 100, 1000000);

    expect(result.rsi14).not.toBeNull();
    expect(result.macd).not.toBeNull();
    expect(result.ma20).not.toBeNull();
    expect(result.ma50).not.toBeNull();
    expect(result.ma200).toBeNull(); // need 200 bars
    expect(result.bollingerBands).not.toBeNull();
    expect(result.volumeSma20).not.toBeNull();
  });

  it('should compute all indicators with 200+ bars', () => {
    const history = generateHistory(210);
    const result = computeIndicators(history, 100, 1000000);

    expect(result.rsi14).not.toBeNull();
    expect(result.macd).not.toBeNull();
    expect(result.ma20).not.toBeNull();
    expect(result.ma50).not.toBeNull();
    expect(result.ma200).not.toBeNull();
    expect(result.bollingerBands).not.toBeNull();
    expect(result.volumeSma20).not.toBeNull();
  });

  it('should detect bullish signals in uptrend', () => {
    const history = generateHistory(50, 80, 1); // strong rising
    const lastClose = history[history.length - 1].close;
    const result = computeIndicators(history, lastClose, 3000000);

    // Price above MA50 at minimum
    expect(result.signalScore).toBeGreaterThan(0);
  });

  it('should detect bearish signals in downtrend', () => {
    const history = generateHistory(50, 120, -0.5); // falling
    const currentPrice = 95;
    const result = computeIndicators(history, currentPrice, 3000000);

    expect(result.direction).toBe('bearish');
    expect(result.signalScore).toBeGreaterThan(0);
  });

  it('should be fast (< 10ms for single computation)', () => {
    const history = generateHistory(200);
    const start = performance.now();
    computeIndicators(history, 100, 1000000);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(10);
  });
});
