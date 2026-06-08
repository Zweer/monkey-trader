import { DEFENSIVE_MODE_DRAWDOWN_PCT } from './constants';
import type { PortfolioState } from './types';

/**
 * Build a PortfolioState from raw DB data.
 * This is a pure transformation — DB fetching happens outside.
 */
export function buildPortfolioState(params: {
  cash: number;
  positions: PortfolioState['positions'];
  dailyTradeCount: number;
  todaySectorTrades: Record<string, number>;
  recentSells: Array<{ ticker: string; timestamp: Date }>;
  weeklyPerformance: number;
}): PortfolioState {
  const invested = params.positions.reduce((sum, p) => sum + p.shares * p.currentPrice, 0);
  const totalValue = params.cash + invested;
  const investedPercent = totalValue > 0 ? (invested / totalValue) * 100 : 0;

  return {
    cash: params.cash,
    totalValue,
    investedPercent,
    positions: params.positions,
    dailyTradeCount: params.dailyTradeCount,
    todaySectorTrades: params.todaySectorTrades,
    recentSells: params.recentSells,
    weeklyPerformance: params.weeklyPerformance,
    isDefensiveMode: params.weeklyPerformance <= DEFENSIVE_MODE_DRAWDOWN_PCT,
  };
}
