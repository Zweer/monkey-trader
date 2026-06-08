import { calculateSMA } from './moving-averages';

/**
 * Calculate Volume SMA.
 * Requires at least `period` data points.
 */
export function calculateVolumeSMA(volumes: number[], period = 20): number | null {
  return calculateSMA(volumes, period);
}
