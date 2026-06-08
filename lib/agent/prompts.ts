import type { TickContext } from './types';

export const SYSTEM_PROMPT = `You are MonkeyTrader, an AI paper trading agent. You analyze technical signals and make motivated trading decisions. You are moderately conservative — you prefer inaction over uncertain action. You never exceed the risk rules provided.

You MUST respond with valid JSON matching the schema. No prose, no explanation outside the JSON structure.`;

const RISK_RULES = `RISK RULES (hard constraints):
- Max 20% portfolio on any single position
- Min 3% position size (no dust)
- Stop loss: -8% mandatory on every position
- Max 70% invested, min 30% cash
- Max 3 trades per day
- If uncertain, HOLD`;

const RESPONSE_SCHEMA = `RESPOND WITH THIS EXACT JSON SCHEMA:
{
  "action": "buy" | "sell" | "hold",
  "ticker": "<ticker>",
  "sizePercent": <0-20>,
  "confidence": <0.0-1.0>,
  "reasoning": "<2-4 sentences>",
  "stopLossPercent": <negative number, e.g. -8>,
  "targetPercent": <positive number, e.g. 12>,
  "timeHorizon": "<e.g. 3-5 days>"
}`;

export function buildTickPrompt(context: TickContext): string {
  const { ticker, currentPrice, change24h, indicators, portfolio, recentDecisions } = context;

  const parts: string[] = [
    `TICKER: ${ticker}`,
    `PRICE: $${currentPrice} (24h: ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%)`,
    '',
    'INDICATORS:',
    `  RSI(14): ${indicators.rsi14?.toFixed(1) ?? 'N/A'}`,
    `  MACD Histogram: ${indicators.macd?.histogram.toFixed(4) ?? 'N/A'}`,
    `  MA50: ${indicators.ma50?.toFixed(2) ?? 'N/A'}`,
    `  MA200: ${indicators.ma200?.toFixed(2) ?? 'N/A'}`,
    `  BB: [${indicators.bollingerBands?.lower.toFixed(2) ?? '?'}, ${indicators.bollingerBands?.upper.toFixed(2) ?? '?'}]`,
    `  Signal Score: ${indicators.signalScore}/5 (${indicators.direction})`,
    '',
    'PORTFOLIO:',
    `  Cash: $${portfolio.cash.toFixed(0)} | Total: $${portfolio.totalValue.toFixed(0)} | Invested: ${(((portfolio.totalValue - portfolio.cash) / portfolio.totalValue) * 100).toFixed(0)}%`,
  ];

  if (portfolio.positions.length > 0) {
    parts.push('  Positions:');
    for (const p of portfolio.positions) {
      parts.push(
        `    ${p.ticker}: ${p.shares} shares @ $${p.avgEntryPrice.toFixed(2)} (${p.pnlPercent > 0 ? '+' : ''}${p.pnlPercent.toFixed(1)}%)`,
      );
    }
  }

  if (recentDecisions.length > 0) {
    parts.push('');
    parts.push('RECENT DECISIONS ON THIS TICKER:');
    for (const d of recentDecisions.slice(0, 3)) {
      parts.push(
        `  ${d.timestamp.toISOString().slice(0, 16)}: ${d.action.toUpperCase()} — ${d.reasoning.slice(0, 80)}`,
      );
    }
  }

  parts.push('');
  parts.push(RISK_RULES);
  parts.push('');
  parts.push(RESPONSE_SCHEMA);

  return parts.join('\n');
}
