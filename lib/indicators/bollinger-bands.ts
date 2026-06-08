import { calculateSMA } from './moving-averages';

export type BBResult = {
  upper: number;
  middle: number;
  lower: number;
};

/**
 * Calculate Bollinger Bands (SMA ± stdDev * σ).
 * Requires at least `period` data points.
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDevMultiplier = 2,
): BBResult | null {
  const middle = calculateSMA(closes, period);
  if (middle === null) return null;

  const slice = closes.slice(-period);
  const variance = slice.reduce((sum, v) => sum + (v - middle) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: middle + stdDevMultiplier * stdDev,
    middle,
    lower: middle - stdDevMultiplier * stdDev,
  };
}
