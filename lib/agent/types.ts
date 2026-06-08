import type { IndicatorResult } from '@/lib/indicators/types';

export type AgentDecision = {
  action: 'buy' | 'sell' | 'hold';
  ticker: string;
  sizePercent: number;
  confidence: number;
  reasoning: string;
  stopLossPercent: number;
  targetPercent: number;
  timeHorizon: string;
};

export type PortfolioContext = {
  cash: number;
  totalValue: number;
  positions: Array<{
    ticker: string;
    shares: number;
    avgEntryPrice: number;
    currentPrice: number;
    pnlPercent: number;
  }>;
};

export type RecentDecision = {
  action: 'buy' | 'sell' | 'hold';
  ticker: string;
  timestamp: Date;
  reasoning: string;
};

export type TickContext = {
  ticker: string;
  currentPrice: number;
  change24h: number;
  indicators: IndicatorResult;
  portfolio: PortfolioContext;
  recentDecisions: RecentDecision[];
  taskType: 'tick' | 'screen' | 'rebalance';
};
