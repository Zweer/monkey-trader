import type { AgentDecision } from '@/lib/agent/types';

import { checkPositionRules, type PositionTrigger } from './rules/position';
import type { Position } from './types';

export function checkAutoTriggers(positions: Position[]): AgentDecision[] {
  const triggers = checkPositionRules(positions);
  return triggers
    .filter((t) => t.action !== 'flag_review')
    .map((t) => triggerToDecision(t, positions));
}

function triggerToDecision(trigger: PositionTrigger, positions: Position[]): AgentDecision {
  const pos = positions.find((p) => p.ticker === trigger.ticker)!;
  const sizePercent =
    trigger.action === 'sell_half' ? pos.portfolioPercent / 2 : pos.portfolioPercent;

  return {
    action: 'sell',
    ticker: trigger.ticker,
    sizePercent,
    confidence: 1,
    reasoning: `Risk rule: ${trigger.rule} — ${trigger.reason}`,
    stopLossPercent: 0,
    targetPercent: 0,
    timeHorizon: 'immediate',
  };
}
