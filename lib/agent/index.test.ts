import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./gemini', () => ({
  callGemini: vi.fn(),
}));

import { callGemini } from './gemini';
import { getDecision } from './index';
import type { TickContext } from './types';

const mockCallGemini = vi.mocked(callGemini);

function makeContext(overrides: Partial<TickContext> = {}): TickContext {
  return {
    ticker: 'AAPL',
    currentPrice: 150,
    change24h: 1.5,
    indicators: {
      rsi14: 30,
      macd: { line: 1, signal: 0.5, histogram: 0.5 },
      ma20: 148,
      ma50: 145,
      ma200: 130,
      bollingerBands: { upper: 160, middle: 150, lower: 140 },
      volumeSma20: 1000000,
      signalScore: 3,
      direction: 'bullish',
      signals: [],
    },
    portfolio: { cash: 7000, totalValue: 10000, positions: [] },
    recentDecisions: [],
    taskType: 'tick',
    ...overrides,
  };
}

const VALID_RESPONSE = JSON.stringify({
  action: 'buy',
  ticker: 'AAPL',
  sizePercent: 5,
  confidence: 0.7,
  reasoning: 'RSI oversold with strong MACD bullish crossover.',
  stopLossPercent: -8,
  targetPercent: 12,
  timeHorizon: '3-5 days',
});

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockCallGemini.mockReset();
});

describe('getDecision', () => {
  it('should return valid decision on first attempt', async () => {
    mockCallGemini.mockResolvedValueOnce({
      text: VALID_RESPONSE,
      inputTokens: 500,
      outputTokens: 100,
    });

    const result = await getDecision(makeContext());

    expect(result.action).toBe('buy');
    expect(result.ticker).toBe('AAPL');
    expect(result.sizePercent).toBe(5);
  });

  it('should retry on invalid first response then succeed', async () => {
    mockCallGemini
      .mockResolvedValueOnce({ text: 'garbage', inputTokens: 100, outputTokens: 10 })
      .mockResolvedValueOnce({ text: VALID_RESPONSE, inputTokens: 500, outputTokens: 100 });

    const result = await getDecision(makeContext());

    expect(result.action).toBe('buy');
    expect(mockCallGemini).toHaveBeenCalledTimes(2);
  });

  it('should fallback to hold after two failures', async () => {
    mockCallGemini
      .mockResolvedValueOnce({ text: 'bad', inputTokens: 100, outputTokens: 10 })
      .mockResolvedValueOnce({ text: 'still bad', inputTokens: 100, outputTokens: 10 });

    const result = await getDecision(makeContext());

    expect(result.action).toBe('hold');
    expect(result.reasoning).toContain('invalid');
  });

  it('should fallback to hold on API error', async () => {
    mockCallGemini
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'));

    const result = await getDecision(makeContext());

    expect(result.action).toBe('hold');
  });

  it('should apply confidence gate (< 0.5 → hold)', async () => {
    const lowConfidence = JSON.stringify({
      ...JSON.parse(VALID_RESPONSE),
      confidence: 0.3,
    });
    mockCallGemini.mockResolvedValueOnce({
      text: lowConfidence,
      inputTokens: 500,
      outputTokens: 100,
    });

    const result = await getDecision(makeContext());

    expect(result.action).toBe('hold');
    expect(result.reasoning).toContain('0.3');
  });

  it('should skip and hold if last decision was < 2h ago', async () => {
    const ctx = makeContext({
      recentDecisions: [
        {
          action: 'buy',
          ticker: 'AAPL',
          timestamp: new Date(Date.now() - 30 * 60000),
          reasoning: 'test',
        },
      ],
    });

    const result = await getDecision(ctx);

    expect(result.action).toBe('hold');
    expect(result.reasoning).toContain('flip-flop');
    expect(mockCallGemini).not.toHaveBeenCalled();
  });

  it('should proceed if last decision was > 2h ago', async () => {
    mockCallGemini.mockResolvedValueOnce({
      text: VALID_RESPONSE,
      inputTokens: 500,
      outputTokens: 100,
    });

    const ctx = makeContext({
      recentDecisions: [
        {
          action: 'buy',
          ticker: 'AAPL',
          timestamp: new Date(Date.now() - 3 * 60 * 60000),
          reasoning: 'old',
        },
      ],
    });

    const result = await getDecision(ctx);

    expect(result.action).toBe('buy');
  });
});
