import type { AgentDecision } from '@/lib/agent/types';

import { COOLDOWN_AFTER_SELL_MS, MAX_SAME_SECTOR_PER_DAY, MAX_TRADES_PER_DAY } from '../constants';
import type { PortfolioState, RiskViolation } from '../types';

export function checkOperational(
  decision: AgentDecision,
  portfolio: PortfolioState,
  positionSector?: string,
): { violations: RiskViolation[] } {
  const violations: RiskViolation[] = [];

  if (decision.action === 'hold') return { violations };

  // Max trades per day (stop-loss exempt)
  if (portfolio.dailyTradeCount >= MAX_TRADES_PER_DAY) {
    violations.push({
      rule: 'max_trades_per_day',
      description: `Already ${portfolio.dailyTradeCount} trades today (max ${MAX_TRADES_PER_DAY})`,
      severity: 'hard',
    });
  }

  if (decision.action === 'buy') {
    // Max same-sector opens per day
    if (positionSector) {
      const sectorCount = portfolio.todaySectorTrades[positionSector] ?? 0;
      if (sectorCount >= MAX_SAME_SECTOR_PER_DAY) {
        violations.push({
          rule: 'max_sector_per_day',
          description: `Already ${sectorCount} trades in "${positionSector}" today (max ${MAX_SAME_SECTOR_PER_DAY})`,
          severity: 'hard',
        });
      }
    }

    // Cooldown after sell
    const recentSell = portfolio.recentSells.find((s) => s.ticker === decision.ticker);
    if (recentSell) {
      const elapsed = Date.now() - recentSell.timestamp.getTime();
      if (elapsed < COOLDOWN_AFTER_SELL_MS) {
        const hoursLeft = ((COOLDOWN_AFTER_SELL_MS - elapsed) / 3600000).toFixed(1);
        violations.push({
          rule: 'sell_cooldown',
          description: `Sold ${decision.ticker} recently — ${hoursLeft}h cooldown remaining`,
          severity: 'hard',
        });
      }
    }
  }

  return { violations };
}
