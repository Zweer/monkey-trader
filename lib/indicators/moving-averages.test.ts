import { describe, expect, it } from 'vitest';

import { calculateBollingerBands } from './bollinger-bands';
import { calculateSMA } from './moving-averages';

describe('calculateSMA', () => {
  it('should return null with insufficient data', () => {
    expect(calculateSMA([1, 2], 5)).toBeNull();
  });

  it('should compute correct SMA', () => {
    expect(calculateSMA([1, 2, 3, 4, 5], 5)).toBe(3);
  });

  it('should use last N values only', () => {
    expect(calculateSMA([10, 20, 1, 2, 3, 4, 5], 5)).toBe(3);
  });
});

describe('calculateBollingerBands', () => {
  it('should return null with insufficient data', () => {
    expect(calculateBollingerBands([1, 2, 3], 20)).toBeNull();
  });

  it('should return tight bands for constant prices', () => {
    const closes = Array(20).fill(100);
    const result = calculateBollingerBands(closes, 20)!;
    expect(result.middle).toBe(100);
    expect(result.upper).toBe(100);
    expect(result.lower).toBe(100);
  });

  it('should widen bands with volatility', () => {
    const closes = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 110 : 90));
    const result = calculateBollingerBands(closes, 20)!;
    expect(result.middle).toBe(100);
    expect(result.upper).toBeGreaterThan(110);
    expect(result.lower).toBeLessThan(90);
  });

  it('should be symmetric around the middle', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 5);
    const result = calculateBollingerBands(closes, 20)!;
    const upperDist = result.upper - result.middle;
    const lowerDist = result.middle - result.lower;
    expect(upperDist).toBeCloseTo(lowerDist);
  });
});
