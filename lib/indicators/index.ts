import type { OHLCV } from '@/lib/data/types';

import { calculateBollingerBands } from './bollinger-bands';
import { calculateMACD } from './macd';
import { calculateSMA } from './moving-averages';
import { calculateRSI } from './rsi';
import { evaluateSignals } from './signals';
import type { IndicatorResult } from './types';
import { calculateVolumeSMA } from './volume';

export function computeIndicators(
  history: OHLCV[],
  currentPrice: number,
  currentVolume: number,
): IndicatorResult {
  const closes = history.map((h) => h.close);
  const volumes = history.map((h) => h.volume);

  const rsi14 = calculateRSI(closes);
  const macd = calculateMACD(closes);
  const ma20 = calculateSMA(closes, 20);
  const ma50 = calculateSMA(closes, 50);
  const ma200 = calculateSMA(closes, 200);
  const bollingerBands = calculateBollingerBands(closes);
  const volumeSma20 = calculateVolumeSMA(volumes);

  const partial: IndicatorResult = {
    rsi14,
    macd,
    ma20,
    ma50,
    ma200,
    bollingerBands,
    volumeSma20,
    signalScore: 0,
    direction: 'neutral',
    signals: [],
  };

  const evaluation = evaluateSignals(partial, currentPrice, currentVolume);
  partial.signalScore = evaluation.score;
  partial.direction = evaluation.direction;
  partial.signals = evaluation.signals;

  return partial;
}

export type { IndicatorResult, SignalDetail, SignalDirection } from './types';
