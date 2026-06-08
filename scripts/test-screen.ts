/**
 * Integration test — calls real Gemini Pro for screening.
 * Requires env var: GEMINI_API_KEY
 *
 * Usage: npx tsx scripts/test-screen.ts
 */

import { callGemini } from '../lib/agent/gemini';
import { buildScreeningPrompt } from '../lib/screen';
import type { QuickScanResult } from '../lib/screen/quick-scan';

const mockCandidates: QuickScanResult[] = [
  {
    ticker: 'AAPL',
    name: 'Apple',
    sector: 'Technology',
    type: 'stock',
    price: 152,
    change24h: 3.2,
    rsi14: 68,
    aboveMa50: true,
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA',
    sector: 'Technology',
    type: 'stock',
    price: 880,
    change24h: 5.5,
    rsi14: 75,
    aboveMa50: true,
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    sector: 'crypto',
    type: 'crypto',
    price: 67500,
    change24h: -2.1,
    rsi14: 32,
    aboveMa50: false,
  },
  {
    ticker: 'ETH',
    name: 'Ethereum',
    sector: 'crypto',
    type: 'crypto',
    price: 3500,
    change24h: -3.5,
    rsi14: 28,
    aboveMa50: false,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    sector: 'Consumer',
    type: 'stock',
    price: 250,
    change24h: 7.2,
    rsi14: 72,
    aboveMa50: true,
  },
  {
    ticker: 'META',
    name: 'Meta',
    sector: 'Technology',
    type: 'stock',
    price: 480,
    change24h: 1.8,
    rsi14: 55,
    aboveMa50: true,
  },
];

async function main(): Promise<void> {
  const prompt = buildScreeningPrompt(mockCandidates, ['AAPL', 'BTC'], ['AAPL']);
  console.log('Prompt length:', prompt.length, 'chars\n');

  const start = Date.now();
  const { text, inputTokens, outputTokens } = await callGemini(
    'pro',
    prompt,
    'You are a screening agent. Respond with valid JSON only.',
  );
  console.log(
    `Gemini Pro responded in ${Date.now() - start}ms (${inputTokens}+${outputTokens} tokens)\n`,
  );
  console.log(text);
}

main().catch(console.error);
