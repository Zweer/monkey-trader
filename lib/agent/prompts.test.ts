import { describe, expect, it } from 'vitest';

import { buildTickPrompt, SYSTEM_PROMPT } from './prompts';
import type { TickContext } from './types';

const mockContext: TickContext = {
  ticker: 'AAPL',
  currentPrice: 150.5,
  change24h: 2.3,
  indicators: {
    rsi14: 35.2,
    macd: { line: 1.5, signal: 0.8, histogram: 0.7 },
    ma20: 148,
    ma50: 145,
    ma200: 130,
    bollingerBands: { upper: 160, middle: 150, lower: 140 },
    volumeSma20: 1000000,
    signalScore: 3,
    direction: 'bullish',
    signals: [],
  },
  portfolio: {
    cash: 7000,
    totalValue: 10000,
    positions: [
      { ticker: 'MSFT', shares: 5, avgEntryPrice: 380, currentPrice: 400, pnlPercent: 5.3 },
    ],
  },
  recentDecisions: [
    {
      action: 'hold',
      ticker: 'AAPL',
      timestamp: new Date('2026-06-08T10:00:00Z'),
      reasoning: 'Signals not strong enough',
    },
  ],
  taskType: 'tick',
};

describe('buildTickPrompt', () => {
  it('should include ticker and price', () => {
    const prompt = buildTickPrompt(mockContext);
    expect(prompt).toContain('TICKER: AAPL');
    expect(prompt).toContain('$150.5');
  });

  it('should include indicators', () => {
    const prompt = buildTickPrompt(mockContext);
    expect(prompt).toContain('RSI(14): 35.2');
    expect(prompt).toContain('Signal Score: 3/5');
    expect(prompt).toContain('bullish');
  });

  it('should include portfolio state', () => {
    const prompt = buildTickPrompt(mockContext);
    expect(prompt).toContain('Cash: $7000');
    expect(prompt).toContain('MSFT');
  });

  it('should include recent decisions', () => {
    const prompt = buildTickPrompt(mockContext);
    expect(prompt).toContain('RECENT DECISIONS');
    expect(prompt).toContain('HOLD');
  });

  it('should include risk rules', () => {
    const prompt = buildTickPrompt(mockContext);
    expect(prompt).toContain('Max 20%');
    expect(prompt).toContain('Stop loss');
  });

  it('should include response schema', () => {
    const prompt = buildTickPrompt(mockContext);
    expect(prompt).toContain('"action"');
    expect(prompt).toContain('"sizePercent"');
  });
});

describe('SYSTEM_PROMPT', () => {
  it('should mention MonkeyTrader personality', () => {
    expect(SYSTEM_PROMPT).toContain('MonkeyTrader');
    expect(SYSTEM_PROMPT).toContain('conservative');
    expect(SYSTEM_PROMPT).toContain('JSON');
  });
});
