import type { GeminiModel } from './gemini';
import type { TickContext } from './types';

export function selectModel(context: TickContext): GeminiModel {
  // Screening and rebalance always use Pro
  if (context.taskType === 'screen' || context.taskType === 'rebalance') return 'pro';

  // High volatility (daily change > 5%) → Pro
  if (Math.abs(context.change24h) > 5) return 'pro';

  // Max signal score with conflicting recent decisions → Pro
  if (context.indicators.signalScore >= 5 && context.recentDecisions.length > 0) return 'pro';

  // Default: Flash for routine tick decisions
  return 'flash';
}
