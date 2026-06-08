import {
  MAX_HOLD_DAYS,
  STOP_LOSS_PCT,
  TAKE_PROFIT_PCT,
  TRAILING_STOP_DROP_PCT,
  TRAILING_STOP_PEAK_PCT,
} from '../constants';
import type { Position, RiskViolation } from '../types';

export type PositionTrigger = {
  ticker: string;
  action: 'sell_all' | 'sell_half' | 'flag_review';
  rule: string;
  reason: string;
};

export function checkPositionRules(positions: Position[]): PositionTrigger[] {
  const triggers: PositionTrigger[] = [];

  for (const pos of positions) {
    // Stop loss: -8%
    if (pos.pnlPercent <= STOP_LOSS_PCT) {
      triggers.push({
        ticker: pos.ticker,
        action: 'sell_all',
        rule: 'stop_loss',
        reason: `Position at ${pos.pnlPercent.toFixed(1)}% (stop loss ${STOP_LOSS_PCT}%)`,
      });
      continue; // no further checks needed
    }

    // Take profit: +15% → sell half
    if (pos.pnlPercent >= TAKE_PROFIT_PCT) {
      triggers.push({
        ticker: pos.ticker,
        action: 'sell_half',
        rule: 'take_profit',
        reason: `Position at +${pos.pnlPercent.toFixed(1)}% (take profit ${TAKE_PROFIT_PCT}%)`,
      });
    }

    // Trailing stop: peak >= +20%, then dropped 5% from peak
    const peakGainPct = ((pos.peakPrice - pos.avgEntryPrice) / pos.avgEntryPrice) * 100;
    if (peakGainPct >= TRAILING_STOP_PEAK_PCT) {
      const dropFromPeak = ((pos.peakPrice - pos.currentPrice) / pos.peakPrice) * 100;
      if (dropFromPeak >= TRAILING_STOP_DROP_PCT) {
        triggers.push({
          ticker: pos.ticker,
          action: 'sell_all',
          rule: 'trailing_stop',
          reason: `Peak gain was +${peakGainPct.toFixed(1)}%, dropped ${dropFromPeak.toFixed(1)}% from peak`,
        });
        continue;
      }
    }

    // Max hold: 14 days → flag for review
    if (pos.daysSinceEntry > MAX_HOLD_DAYS) {
      triggers.push({
        ticker: pos.ticker,
        action: 'flag_review',
        rule: 'max_hold',
        reason: `Held for ${pos.daysSinceEntry} days (max ${MAX_HOLD_DAYS})`,
      });
    }
  }

  return triggers;
}
