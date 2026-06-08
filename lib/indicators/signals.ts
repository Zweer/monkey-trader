import type { IndicatorResult, SignalDetail, SignalDirection } from './types';

export type SignalEvaluation = {
  score: number;
  direction: SignalDirection;
  signals: SignalDetail[];
};

export function evaluateSignals(
  indicators: IndicatorResult,
  currentPrice: number,
  currentVolume: number,
): SignalEvaluation {
  const signals: SignalDetail[] = [];

  // RSI
  if (indicators.rsi14 !== null) {
    if (indicators.rsi14 < 30) {
      signals.push({
        indicator: 'RSI',
        signal: 'bullish',
        value: indicators.rsi14,
        reason: 'Oversold (<30)',
      });
    } else if (indicators.rsi14 > 70) {
      signals.push({
        indicator: 'RSI',
        signal: 'bearish',
        value: indicators.rsi14,
        reason: 'Overbought (>70)',
      });
    }
  }

  // MACD
  if (indicators.macd !== null) {
    if (indicators.macd.histogram > 0) {
      signals.push({
        indicator: 'MACD',
        signal: 'bullish',
        value: indicators.macd.histogram,
        reason: 'Histogram positive',
      });
    } else if (indicators.macd.histogram < 0) {
      signals.push({
        indicator: 'MACD',
        signal: 'bearish',
        value: indicators.macd.histogram,
        reason: 'Histogram negative',
      });
    }
  }

  // Price vs MA50
  if (indicators.ma50 !== null) {
    if (currentPrice > indicators.ma50) {
      signals.push({
        indicator: 'MA50',
        signal: 'bullish',
        value: currentPrice / indicators.ma50,
        reason: 'Price above MA50',
      });
    } else {
      signals.push({
        indicator: 'MA50',
        signal: 'bearish',
        value: currentPrice / indicators.ma50,
        reason: 'Price below MA50',
      });
    }
  }

  // Bollinger Bands proximity (within 2%)
  if (indicators.bollingerBands !== null) {
    const { upper, lower } = indicators.bollingerBands;
    const range = upper - lower;
    if (range > 0) {
      const distToLower = (currentPrice - lower) / range;
      const distToUpper = (upper - currentPrice) / range;
      if (distToLower < 0.02) {
        signals.push({
          indicator: 'BB',
          signal: 'bullish',
          value: distToLower,
          reason: 'Price near lower band',
        });
      } else if (distToUpper < 0.02) {
        signals.push({
          indicator: 'BB',
          signal: 'bearish',
          value: distToUpper,
          reason: 'Price near upper band',
        });
      }
    }
  }

  // Volume confirmation
  if (indicators.volumeSma20 !== null && currentVolume > 0 && indicators.volumeSma20 > 0) {
    const volumeRatio = currentVolume / indicators.volumeSma20;
    if (volumeRatio > 1.5) {
      // Volume confirms existing direction — find dominant so far
      const bullish = signals.filter((s) => s.signal === 'bullish').length;
      const bearish = signals.filter((s) => s.signal === 'bearish').length;
      const dominant: SignalDirection =
        bullish > bearish ? 'bullish' : bearish > bullish ? 'bearish' : 'neutral';
      if (dominant !== 'neutral') {
        signals.push({
          indicator: 'Volume',
          signal: dominant,
          value: volumeRatio,
          reason: `Volume ${volumeRatio.toFixed(1)}x avg confirms ${dominant}`,
        });
      }
    }
  }

  // Count aligned signals
  const bullishCount = signals.filter((s) => s.signal === 'bullish').length;
  const bearishCount = signals.filter((s) => s.signal === 'bearish').length;
  const score = Math.max(bullishCount, bearishCount);
  const direction: SignalDirection =
    bullishCount > bearishCount ? 'bullish' : bearishCount > bullishCount ? 'bearish' : 'neutral';

  return { score: Math.min(score, 5), direction, signals };
}
