import type { AgentDecision } from '@/lib/agent/types';

import { checkAllocation } from './rules/allocation';
import { checkExposure } from './rules/exposure';
import { checkOperational } from './rules/operational';
import type { PortfolioState, RiskVerdict, RiskViolation } from './types';

export function checkRisk(decision: AgentDecision, portfolio: PortfolioState): RiskVerdict {
  if (decision.action === 'hold') {
    return {
      approved: true,
      action: 'approved',
      originalSize: 0,
      adjustedSize: 0,
      violations: [],
      reason: 'Hold — no risk check needed',
    };
  }

  const violations: RiskViolation[] = [];
  let adjustedSize = decision.sizePercent;

  // Allocation rules
  const allocation = checkAllocation(decision, portfolio);
  violations.push(...allocation.violations);
  if (allocation.adjustedSize < adjustedSize) adjustedSize = allocation.adjustedSize;

  // Exposure rules
  const exposure = checkExposure({ ...decision, sizePercent: adjustedSize }, portfolio);
  violations.push(...exposure.violations);
  if (exposure.adjustedSize < adjustedSize) adjustedSize = exposure.adjustedSize;

  // Operational rules
  const pos = portfolio.positions.find((p) => p.ticker === decision.ticker);
  const operational = checkOperational(decision, portfolio, pos?.sector);
  violations.push(...operational.violations);

  // Determine verdict
  const hardViolations = violations.filter((v) => v.severity === 'hard');

  if (hardViolations.length > 0) {
    return {
      approved: false,
      action: 'rejected',
      originalSize: decision.sizePercent,
      adjustedSize: 0,
      violations,
      reason: hardViolations.map((v) => v.description).join('; '),
    };
  }

  const softViolations = violations.filter((v) => v.severity === 'soft');
  if (softViolations.length > 0) {
    return {
      approved: true,
      action: 'downsized',
      originalSize: decision.sizePercent,
      adjustedSize,
      violations,
      reason: softViolations.map((v) => v.description).join('; '),
    };
  }

  return {
    approved: true,
    action: 'approved',
    originalSize: decision.sizePercent,
    adjustedSize,
    violations: [],
    reason: 'All risk checks passed',
  };
}

export { buildPortfolioState } from './portfolio-state';
export { checkAutoTriggers } from './triggers';
export type { PortfolioState, Position, RiskVerdict, RiskViolation } from './types';
