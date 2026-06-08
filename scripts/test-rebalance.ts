/**
 * Integration test — calls real Gemini Pro for rebalancing.
 * Requires env var: GEMINI_API_KEY
 *
 * Usage: npx tsx scripts/test-rebalance.ts
 */

import { callGemini } from '../lib/agent/gemini';
import { buildRebalancePrompt } from '../lib/rebalance';
import type { Position } from '../lib/risk/types';

const mockPositions: Position[] = [
  {
    ticker: 'AAPL',
    type: 'stock',
    sector: 'Technology',
    shares: 10,
    avgEntryPrice: 140,
    currentPrice: 155,
    pnlPercent: 10.7,
    peakPrice: 158,
    portfolioPercent: 15.5,
    daysSinceEntry: 12,
  },
  {
    ticker: 'BTC',
    type: 'crypto',
    sector: 'crypto',
    shares: 0.1,
    avgEntryPrice: 60000,
    currentPrice: 67000,
    pnlPercent: 11.7,
    peakPrice: 69000,
    portfolioPercent: 6.7,
    daysSinceEntry: 20,
  },
  {
    ticker: 'NVDA',
    type: 'stock',
    sector: 'Technology',
    shares: 2,
    avgEntryPrice: 800,
    currentPrice: 880,
    pnlPercent: 10,
    peakPrice: 900,
    portfolioPercent: 17.6,
    daysSinceEntry: 8,
  },
];

async function main(): Promise<void> {
  const prompt = buildRebalancePrompt(mockPositions, 6000, 10000, -1.5);
  console.log('Prompt length:', prompt.length, 'chars\n');

  const start = Date.now();
  const { text, inputTokens, outputTokens } = await callGemini(
    'pro',
    prompt,
    'You are a rebalance agent. Respond with valid JSON only.',
  );
  console.log(
    `Gemini Pro responded in ${Date.now() - start}ms (${inputTokens}+${outputTokens} tokens)\n`,
  );
  console.log(text);
}

main().catch(console.error);
