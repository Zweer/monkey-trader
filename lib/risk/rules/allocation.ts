import type { AgentDecision } from '@/lib/agent/types';

import {
  MAX_SINGLE_POSITION_PCT,
  MAX_SINGLE_SECTOR_PCT,
  MAX_SPECULATIVE_PCT,
  MIN_POSITION_SIZE_PCT,
  MIN_SAFE_ASSETS_PCT,
  SAFE_CRYPTO,
  SAFE_STOCKS,
} from '../constants';
import type { PortfolioState, RiskViolation } from '../types';

function isSafe(ticker: string, type: 'stock' | 'crypto'): boolean {
  return type === 'crypto' ? SAFE_CRYPTO.has(ticker) : SAFE_STOCKS.has(ticker);
}

export function checkAllocation(
  decision: AgentDecision,
  portfolio: PortfolioState,
): { violations: RiskViolation[]; adjustedSize: number } {
  const violations: RiskViolation[] = [];
  let adjustedSize = decision.sizePercent;

  if (decision.action === 'hold') return { violations, adjustedSize: 0 };

  // Min position size (only for buys)
  if (decision.action === 'buy' && decision.sizePercent < MIN_POSITION_SIZE_PCT) {
    violations.push({
      rule: 'min_position_size',
      description: `Position ${decision.sizePercent}% below minimum ${MIN_POSITION_SIZE_PCT}%`,
      severity: 'hard',
    });
    return { violations, adjustedSize };
  }

  if (decision.action === 'buy') {
    // Max single position
    const existing = portfolio.positions.find((p) => p.ticker === decision.ticker);
    const currentPct = existing?.portfolioPercent ?? 0;
    const newPct = currentPct + decision.sizePercent;
    if (newPct > MAX_SINGLE_POSITION_PCT) {
      const maxAdd = MAX_SINGLE_POSITION_PCT - currentPct;
      if (maxAdd < MIN_POSITION_SIZE_PCT) {
        violations.push({
          rule: 'max_single_position',
          description: `Position would be ${newPct.toFixed(1)}% (max ${MAX_SINGLE_POSITION_PCT}%)`,
          severity: 'hard',
        });
      } else {
        adjustedSize = maxAdd;
        violations.push({
          rule: 'max_single_position',
          description: `Downsized from ${decision.sizePercent}% to ${maxAdd.toFixed(1)}%`,
          severity: 'soft',
        });
      }
    }

    // Max single sector
    const pos = portfolio.positions.find((p) => p.ticker === decision.ticker);
    const sector = pos?.sector ?? 'unknown';
    const sectorPct = portfolio.positions
      .filter((p) => p.sector === sector)
      .reduce((sum, p) => sum + p.portfolioPercent, 0);
    if (sectorPct + adjustedSize > MAX_SINGLE_SECTOR_PCT) {
      violations.push({
        rule: 'max_sector',
        description: `Sector "${sector}" would be ${(sectorPct + adjustedSize).toFixed(1)}% (max ${MAX_SINGLE_SECTOR_PCT}%)`,
        severity: 'hard',
      });
    }

    // Max speculative
    const posType = pos?.type ?? 'stock';
    if (!isSafe(decision.ticker, posType)) {
      const specPct = portfolio.positions
        .filter((p) => !isSafe(p.ticker, p.type))
        .reduce((sum, p) => sum + p.portfolioPercent, 0);
      if (specPct + adjustedSize > MAX_SPECULATIVE_PCT) {
        violations.push({
          rule: 'max_speculative',
          description: `Speculative allocation would be ${(specPct + adjustedSize).toFixed(1)}% (max ${MAX_SPECULATIVE_PCT}%)`,
          severity: 'hard',
        });
      }
    }
  }

  if (decision.action === 'sell') {
    // Min safe assets
    const pos = portfolio.positions.find((p) => p.ticker === decision.ticker);
    if (pos && isSafe(pos.ticker, pos.type)) {
      const safePct = portfolio.positions
        .filter((p) => isSafe(p.ticker, p.type))
        .reduce((sum, p) => sum + p.portfolioPercent, 0);
      if (safePct - decision.sizePercent < MIN_SAFE_ASSETS_PCT) {
        violations.push({
          rule: 'min_safe_assets',
          description: `Safe assets would drop to ${(safePct - decision.sizePercent).toFixed(1)}% (min ${MIN_SAFE_ASSETS_PCT}%)`,
          severity: 'hard',
        });
      }
    }
  }

  return { violations, adjustedSize };
}
