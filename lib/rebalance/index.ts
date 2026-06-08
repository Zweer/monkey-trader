import { getDb } from '@/db';
import { portfolio, portfolioState } from '@/db/schema';
import { callGemini } from '@/lib/agent/gemini';
import type { AgentDecision } from '@/lib/agent/types';
import { checkRisk } from '@/lib/risk';
import type { PortfolioState, Position } from '@/lib/risk/types';
import { executeBuy, executeSell } from '@/lib/tick/execute-trade';

export type RebalanceAction = {
  ticker: string;
  action: 'close' | 'reduce' | 'increase';
  sizePercent: number;
  reason: string;
};

export type RebalanceResult = {
  actions: RebalanceAction[];
  portfolioAssessment: string;
  riskLevel: 'low' | 'moderate' | 'high';
  suggestedCashTarget: number;
  executed: number;
  rejected: number;
};

const SYSTEM_PROMPT = `You are MonkeyTrader's rebalance agent. You review the entire portfolio weekly and suggest structural changes. Be conservative — prefer fewer, high-conviction changes. Respond with valid JSON only.`;

export function buildRebalancePrompt(
  positions: Position[],
  cash: number,
  totalValue: number,
  weeklyPerformance: number,
): string {
  const posLines = positions.map(
    (p) =>
      `${p.ticker} | ${p.shares.toFixed(4)} shares | entry $${p.avgEntryPrice.toFixed(2)} | now $${p.currentPrice.toFixed(2)} | ${p.pnlPercent > 0 ? '+' : ''}${p.pnlPercent.toFixed(1)}% | ${p.daysSinceEntry}d held | ${p.portfolioPercent.toFixed(1)}% of portfolio`,
  );

  const investedPct = totalValue > 0 ? (((totalValue - cash) / totalValue) * 100).toFixed(1) : '0';

  return `PORTFOLIO STATE:
Cash: $${cash.toFixed(0)} (${((cash / totalValue) * 100).toFixed(1)}%)
Total Value: $${totalValue.toFixed(0)}
Invested: ${investedPct}%
Weekly Performance: ${weeklyPerformance > 0 ? '+' : ''}${weeklyPerformance.toFixed(2)}%

POSITIONS:
${posLines.length > 0 ? posLines.join('\n') : 'No positions'}

RULES: Max 5 actions. Actions must be: close (sell all), reduce (sell partial), increase (buy more).
Each action needs sizePercent (% of portfolio to trade).

RESPOND WITH THIS JSON:
{
  "actions": [{ "ticker": "...", "action": "close|reduce|increase", "sizePercent": <number>, "reason": "..." }],
  "portfolioAssessment": "3-5 sentences",
  "riskLevel": "low|moderate|high",
  "suggestedCashTarget": <percent 30-50>
}`;
}

export function parseRebalanceResult(raw: string): RebalanceResult | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/m, '')
      .replace(/\n?```\s*$/m, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.actions)) return null;
    if (typeof parsed.portfolioAssessment !== 'string') return null;
    if (!['low', 'moderate', 'high'].includes(parsed.riskLevel)) return null;

    const actions: RebalanceAction[] = parsed.actions
      .slice(0, 5)
      .filter(
        (a: unknown) =>
          typeof a === 'object' &&
          a !== null &&
          'ticker' in a &&
          'action' in a &&
          'sizePercent' in a &&
          'reason' in a &&
          ['close', 'reduce', 'increase'].includes((a as RebalanceAction).action),
      );

    return {
      actions,
      portfolioAssessment: parsed.portfolioAssessment,
      riskLevel: parsed.riskLevel,
      suggestedCashTarget: Number(parsed.suggestedCashTarget) || 30,
      executed: 0,
      rejected: 0,
    };
  } catch {
    return null;
  }
}

export async function runRebalance(): Promise<RebalanceResult> {
  const db = getDb();

  const posRows = await db.select().from(portfolio);
  const stateRows = await db.select().from(portfolioState).limit(1);
  const cash = stateRows.length > 0 ? Number(stateRows[0].cash) : 10000;
  const totalValue = stateRows.length > 0 ? Number(stateRows[0].totalValue) : 10000;

  const positions: Position[] = posRows.map((p) => ({
    ticker: p.ticker,
    type: 'stock' as const,
    sector: 'unknown',
    shares: Number(p.shares),
    avgEntryPrice: Number(p.avgEntryPrice),
    currentPrice: Number(p.currentPrice),
    pnlPercent:
      ((Number(p.currentPrice) - Number(p.avgEntryPrice)) / Number(p.avgEntryPrice)) * 100,
    peakPrice: Number(p.currentPrice),
    portfolioPercent:
      totalValue > 0 ? ((Number(p.shares) * Number(p.currentPrice)) / totalValue) * 100 : 0,
    daysSinceEntry: Math.floor((Date.now() - p.openedAt.getTime()) / 86400000),
  }));

  const prompt = buildRebalancePrompt(positions, cash, totalValue, 0);
  const { text } = await callGemini('pro', prompt, SYSTEM_PROMPT);

  let result = parseRebalanceResult(text);
  if (!result) {
    const { text: retry } = await callGemini('pro', prompt, SYSTEM_PROMPT);
    result = parseRebalanceResult(retry);
  }

  if (!result) {
    return {
      actions: [],
      portfolioAssessment: 'Rebalance failed',
      riskLevel: 'moderate',
      suggestedCashTarget: 30,
      executed: 0,
      rejected: 0,
    };
  }

  // Execute approved actions
  const cashState = { cash };
  const portfolioContext: PortfolioState = {
    cash,
    totalValue,
    investedPercent: ((totalValue - cash) / totalValue) * 100,
    positions,
    dailyTradeCount: 0,
    todaySectorTrades: {},
    recentSells: [],
    weeklyPerformance: 0,
    isDefensiveMode: false,
  };

  for (const action of result.actions) {
    const decision: AgentDecision = {
      action: action.action === 'increase' ? 'buy' : 'sell',
      ticker: action.ticker,
      sizePercent: action.sizePercent,
      confidence: 0.8,
      reasoning: `Rebalance: ${action.reason}`,
      stopLossPercent: -8,
      targetPercent: 12,
      timeHorizon: '1 week',
    };

    const verdict = checkRisk(decision, portfolioContext);
    if (verdict.approved) {
      const pos = posRows.find((p) => p.ticker === action.ticker);
      if (decision.action === 'buy') {
        executeBuy(decision, pos ? Number(pos.currentPrice) : 0, totalValue, cashState);
      } else if (pos) {
        executeSell(decision, Number(pos.currentPrice), totalValue, cashState, {
          ticker: pos.ticker,
          shares: Number(pos.shares),
          avgEntryPrice: Number(pos.avgEntryPrice),
        });
      }
      result.executed++;
    } else {
      result.rejected++;
    }
  }

  return result;
}
