/**
 * Calculate Simple Moving Average.
 * Requires at least `period` data points.
 */
export function calculateSMA(values: number[], period: number): number | null {
  if (values.length < period) return null;

  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) {
    sum += values[i];
  }
  return sum / period;
}
