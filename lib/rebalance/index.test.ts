import { describe, expect, it } from 'vitest';

import type { Position } from '@/lib/risk/types';

import { buildRebalancePrompt, parseRebalanceResult } from './index';

const mockPositions: Position[] = [
  {
    ticker: 'AAPL',
    type: 'stock',
    sector: 'Tech',
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
];

describe('buildRebalancePrompt', () => {
  it('should include positions and portfolio stats', () => {
    const prompt = buildRebalancePrompt(mockPositions, 7000, 10000, -2.5);
    expect(prompt).toContain('AAPL');
    expect(prompt).toContain('BTC');
    expect(prompt).toContain('Cash: $7000');
    expect(prompt).toContain('-2.50%');
  });

  it('should handle empty positions', () => {
    const prompt = buildRebalancePrompt([], 10000, 10000, 0);
    expect(prompt).toContain('No positions');
  });
});

describe('parseRebalanceResult', () => {
  it('should parse valid response', () => {
    const json = JSON.stringify({
      actions: [
        { ticker: 'BTC', action: 'reduce', sizePercent: 3, reason: 'Held too long' },
        { ticker: 'AAPL', action: 'close', sizePercent: 15, reason: 'Take profit' },
      ],
      portfolioAssessment: 'Portfolio is well diversified but BTC overexposed.',
      riskLevel: 'moderate',
      suggestedCashTarget: 35,
    });

    const result = parseRebalanceResult(json);
    expect(result).not.toBeNull();
    expect(result!.actions).toHaveLength(2);
    expect(result!.riskLevel).toBe('moderate');
    expect(result!.suggestedCashTarget).toBe(35);
  });

  it('should cap actions at 5', () => {
    const actions = Array.from({ length: 8 }, (_, i) => ({
      ticker: `T${i}`,
      action: 'reduce',
      sizePercent: 3,
      reason: 'test',
    }));
    const json = JSON.stringify({
      actions,
      portfolioAssessment: 'Test',
      riskLevel: 'low',
      suggestedCashTarget: 30,
    });

    const result = parseRebalanceResult(json);
    expect(result!.actions).toHaveLength(5);
  });

  it('should return null for invalid JSON', () => {
    expect(parseRebalanceResult('not json')).toBeNull();
  });

  it('should return null for invalid riskLevel', () => {
    const json = JSON.stringify({
      actions: [],
      portfolioAssessment: 'Test',
      riskLevel: 'extreme',
      suggestedCashTarget: 30,
    });
    expect(parseRebalanceResult(json)).toBeNull();
  });

  it('should filter invalid actions', () => {
    const json = JSON.stringify({
      actions: [
        { ticker: 'BTC', action: 'yolo', sizePercent: 3, reason: 'invalid' },
        { ticker: 'AAPL', action: 'close', sizePercent: 10, reason: 'valid' },
      ],
      portfolioAssessment: 'Test',
      riskLevel: 'low',
      suggestedCashTarget: 30,
    });

    const result = parseRebalanceResult(json);
    expect(result!.actions).toHaveLength(1);
    expect(result!.actions[0].ticker).toBe('AAPL');
  });
});
