import { describe, expect, it } from 'vitest';

import { calculateRSI } from './rsi';

describe('calculateRSI', () => {
  it('should return null with insufficient data', () => {
    expect(calculateRSI([1, 2, 3], 14)).toBeNull();
  });

  it('should return 100 when all changes are gains', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    expect(calculateRSI(closes)).toBe(100);
  });

  it('should return 0 when all changes are losses', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 - i);
    expect(calculateRSI(closes)).toBe(0);
  });

  it('should return ~50 for alternating gains/losses of equal magnitude', () => {
    // alternating +1/-1 pattern
    const closes: number[] = [100];
    for (let i = 1; i < 30; i++) {
      closes.push(closes[i - 1] + (i % 2 === 0 ? -1 : 1));
    }
    const rsi = calculateRSI(closes)!;
    expect(rsi).toBeGreaterThan(45);
    expect(rsi).toBeLessThan(55);
  });

  // Known RSI value verified against TradingView-style calculation
  it('should compute correct RSI for known dataset', () => {
    const closes = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61,
      46.28, 46.28, 46.0, 46.03, 46.41, 46.22, 45.64,
    ];
    const rsi = calculateRSI(closes, 14)!;
    // Wilder's smoothed RSI for this dataset
    expect(rsi).toBeGreaterThan(55);
    expect(rsi).toBeLessThan(60);
  });
});
