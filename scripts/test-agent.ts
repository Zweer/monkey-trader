/**
 * Integration test — calls real Gemini API with a test context.
 * Requires env var: GEMINI_API_KEY
 *
 * Usage: npx tsx scripts/test-agent.ts
 */

import { getDecision } from '../lib/agent';
import type { TickContext } from '../lib/agent/types';

const context: TickContext = {
  ticker: 'BTC',
  currentPrice: 67500,
  change24h: 2.3,
  indicators: {
    rsi14: 35.2,
    macd: { line: 150, signal: 80, histogram: 70 },
    ma20: 66000,
    ma50: 64000,
    ma200: 55000,
    bollingerBands: { upper: 70000, middle: 66000, lower: 62000 },
    volumeSma20: 25000,
    signalScore: 3,
    direction: 'bullish',
    signals: [
      { indicator: 'RSI', signal: 'bullish', value: 35.2, reason: 'Approaching oversold' },
      { indicator: 'MACD', signal: 'bullish', value: 70, reason: 'Histogram positive' },
      { indicator: 'MA50', signal: 'bullish', value: 1.05, reason: 'Price above MA50' },
    ],
  },
  portfolio: {
    cash: 7000,
    totalValue: 10000,
    positions: [
      { ticker: 'ETH', shares: 1.5, avgEntryPrice: 3200, currentPrice: 3500, pnlPercent: 9.4 },
    ],
  },
  recentDecisions: [],
  taskType: 'tick',
};

async function main(): Promise<void> {
  console.log('Calling Gemini with test context (BTC, bullish signals)...\n');

  const start = Date.now();
  const decision = await getDecision(context);
  const elapsed = Date.now() - start;

  console.log('=== Decision ===');
  console.log(JSON.stringify(decision, null, 2));
  console.log(`\nCompleted in ${elapsed}ms`);
}

main().catch(console.error);
