import type { Db } from '@/db';
import { indicators } from '@/db/schema';

import type { IndicatorResult } from './types';

export async function saveIndicators(
  db: Db,
  ticker: string,
  result: IndicatorResult,
  timestamp: Date = new Date(),
): Promise<void> {
  await db.insert(indicators).values({
    ticker,
    timestamp,
    rsi14: result.rsi14 !== null ? String(result.rsi14) : null,
    macdLine: result.macd?.line !== undefined ? String(result.macd.line) : null,
    macdSignal: result.macd?.signal !== undefined ? String(result.macd.signal) : null,
    macdHistogram: result.macd?.histogram !== undefined ? String(result.macd.histogram) : null,
    ma20: result.ma20 !== null ? String(result.ma20) : null,
    ma50: result.ma50 !== null ? String(result.ma50) : null,
    ma200: result.ma200 !== null ? String(result.ma200) : null,
    bbUpper:
      result.bollingerBands?.upper !== undefined ? String(result.bollingerBands.upper) : null,
    bbMiddle:
      result.bollingerBands?.middle !== undefined ? String(result.bollingerBands.middle) : null,
    bbLower:
      result.bollingerBands?.lower !== undefined ? String(result.bollingerBands.lower) : null,
    volumeSma20: result.volumeSma20 !== null ? String(result.volumeSma20) : null,
    signalScore: result.signalScore,
  });
}

export async function saveAllIndicators(
  db: Db,
  results: Map<string, IndicatorResult>,
  timestamp: Date = new Date(),
): Promise<void> {
  for (const [ticker, result] of results) {
    await saveIndicators(db, ticker, result, timestamp);
  }
}
