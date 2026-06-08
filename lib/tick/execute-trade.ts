import type { AgentDecision } from '@/lib/agent/types';

export type TradeResult = {
  executed: boolean;
  ticker: string;
  action: 'buy' | 'sell';
  shares: number;
  price: number;
  totalCost: number;
  error?: string;
};

export type PositionState = {
  ticker: string;
  shares: number;
  avgEntryPrice: number;
};

export type CashState = {
  cash: number;
};

export function executeBuy(
  decision: AgentDecision,
  currentPrice: number,
  portfolioValue: number,
  state: CashState,
  existingPosition?: PositionState,
): TradeResult {
  const amount = (decision.sizePercent / 100) * portfolioValue;

  if (amount > state.cash) {
    return {
      executed: false,
      ticker: decision.ticker,
      action: 'buy',
      shares: 0,
      price: currentPrice,
      totalCost: 0,
      error: 'Insufficient cash',
    };
  }

  const shares = amount / currentPrice;
  state.cash -= amount;

  if (existingPosition) {
    // Average entry price
    const totalShares = existingPosition.shares + shares;
    existingPosition.avgEntryPrice =
      (existingPosition.avgEntryPrice * existingPosition.shares + currentPrice * shares) /
      totalShares;
    existingPosition.shares = totalShares;
  }

  return {
    executed: true,
    ticker: decision.ticker,
    action: 'buy',
    shares,
    price: currentPrice,
    totalCost: amount,
  };
}

export function executeSell(
  decision: AgentDecision,
  currentPrice: number,
  portfolioValue: number,
  state: CashState,
  position: PositionState,
): TradeResult {
  const amount = (decision.sizePercent / 100) * portfolioValue;
  const sharesToSell = Math.min(amount / currentPrice, position.shares);
  const proceeds = sharesToSell * currentPrice;

  state.cash += proceeds;
  position.shares -= sharesToSell;

  return {
    executed: true,
    ticker: decision.ticker,
    action: 'sell',
    shares: sharesToSell,
    price: currentPrice,
    totalCost: proceeds,
  };
}
