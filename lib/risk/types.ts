export type RiskViolation = {
  rule: string;
  description: string;
  severity: 'hard' | 'soft';
};

export type RiskVerdict = {
  approved: boolean;
  action: 'approved' | 'rejected' | 'downsized';
  originalSize: number;
  adjustedSize: number;
  violations: RiskViolation[];
  reason: string;
};

export type Position = {
  ticker: string;
  type: 'stock' | 'crypto';
  sector: string;
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  pnlPercent: number;
  peakPrice: number;
  portfolioPercent: number;
  daysSinceEntry: number;
};

export type PortfolioState = {
  cash: number;
  totalValue: number;
  investedPercent: number;
  positions: Position[];
  dailyTradeCount: number;
  todaySectorTrades: Record<string, number>;
  recentSells: Array<{ ticker: string; timestamp: Date }>;
  weeklyPerformance: number;
  isDefensiveMode: boolean;
};
