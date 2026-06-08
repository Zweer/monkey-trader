export type MACDResult = {
  line: number;
  signal: number;
  histogram: number;
};

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [values[0]];

  for (let i = 1; i < values.length; i++) {
    result.push(values[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

/**
 * Calculate MACD (12, 26, 9).
 * Requires at least 26 data points.
 */
export function calculateMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): MACDResult | null {
  if (closes.length < slow) return null;

  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);

  const macdLine: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    macdLine.push(emaFast[i] - emaSlow[i]);
  }

  const signalLine = ema(macdLine, signalPeriod);

  const lastIdx = closes.length - 1;
  const line = macdLine[lastIdx];
  const signal = signalLine[lastIdx];

  return {
    line,
    signal,
    histogram: line - signal,
  };
}
