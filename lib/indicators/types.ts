import type { BBResult } from './bollinger-bands';
import type { MACDResult } from './macd';

export type SignalDirection = 'bullish' | 'bearish' | 'neutral';

export type SignalDetail = {
  indicator: string;
  signal: SignalDirection;
  value: number;
  reason: string;
};

export type IndicatorResult = {
  rsi14: number | null;
  macd: MACDResult | null;
  ma20: number | null;
  ma50: number | null;
  ma200: number | null;
  bollingerBands: BBResult | null;
  volumeSma20: number | null;
  signalScore: number;
  direction: SignalDirection;
  signals: SignalDetail[];
};
