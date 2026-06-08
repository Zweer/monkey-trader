import type { AgentDecision } from '@/lib/agent/types';

import { MAX_INVESTED_PCT, MIN_POSITION_SIZE_PCT } from '../constants';
import type { PortfolioState, RiskViolation } from '../types';

export function checkExposure(
  decision: AgentDecision,
  portfolio: PortfolioState,
): { violations: RiskViolation[]; adjustedSize: number } {
  const violations: RiskViolation[] = [];
  let adjustedSize = decision.sizePercent;

  if (decision.action !== 'buy') return { violations, adjustedSize };

  // Defensive mode: no buys allowed
  if (portfolio.isDefensiveMode) {
    violations.push({
      rule: 'defensive_mode',
      description: `Portfolio down ${portfolio.weeklyPerformance.toFixed(1)}% this week — no new buys`,
      severity: 'hard',
    });
    return { violations, adjustedSize };
  }

  // Max invested: 70% — downsize to maintain 30% cash
  const newInvestedPct = portfolio.investedPercent + adjustedSize;
  if (newInvestedPct > MAX_INVESTED_PCT) {
    const maxBuy = MAX_INVESTED_PCT - portfolio.investedPercent;
    if (maxBuy < MIN_POSITION_SIZE_PCT) {
      violations.push({
        rule: 'max_invested',
        description: `Already at ${portfolio.investedPercent.toFixed(1)}% invested — no room for min position`,
        severity: 'hard',
      });
    } else {
      adjustedSize = maxBuy;
      violations.push({
        rule: 'max_invested',
        description: `Downsized from ${decision.sizePercent}% to ${maxBuy.toFixed(1)}% to keep 30% cash`,
        severity: 'soft',
      });
    }
  }

  return { violations, adjustedSize };
}
