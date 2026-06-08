import { describe, expect, it } from 'vitest';

import { calculateMACD } from './macd';

describe('calculateMACD', () => {
  it('should return null with insufficient data', () => {
    expect(calculateMACD(Array(25).fill(100))).toBeNull();
  });

  it('should return near-zero histogram for flat prices', () => {
    const closes = Array(50).fill(100);
    const result = calculateMACD(closes)!;
    expect(result.line).toBeCloseTo(0, 5);
    expect(result.signal).toBeCloseTo(0, 5);
    expect(result.histogram).toBeCloseTo(0, 5);
  });

  it('should return positive histogram in uptrend', () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i * 2);
    const result = calculateMACD(closes)!;
    expect(result.line).toBeGreaterThan(0);
    expect(result.histogram).toBeGreaterThan(0);
  });

  it('should return negative histogram in downtrend', () => {
    const closes = Array.from({ length: 50 }, (_, i) => 200 - i * 2);
    const result = calculateMACD(closes)!;
    expect(result.line).toBeLessThan(0);
    expect(result.histogram).toBeLessThan(0);
  });

  it('should detect crossover (histogram sign change)', () => {
    // Downtrend then sharp uptrend
    const down = Array.from({ length: 35 }, (_, i) => 100 - i);
    const up = Array.from({ length: 20 }, (_, i) => 65 + i * 3);
    const closes = [...down, ...up];
    const result = calculateMACD(closes)!;
    // After sharp reversal, MACD line should be above signal
    expect(result.histogram).toBeGreaterThan(0);
  });
});
