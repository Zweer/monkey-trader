import { describe, expect, it } from 'vitest';

import { buildScreeningPrompt, parseScreeningResult } from './index';
import type { QuickScanResult } from './quick-scan';

const mockCandidates: QuickScanResult[] = [
  {
    ticker: 'AAPL',
    name: 'Apple',
    sector: 'Technology',
    type: 'stock',
    price: 150,
    change24h: 5.2,
    rsi14: 72,
    aboveMa50: true,
  },
  {
    ticker: 'BTC',
    name: 'Bitcoin',
    sector: 'crypto',
    type: 'crypto',
    price: 67000,
    change24h: -3.1,
    rsi14: 28,
    aboveMa50: false,
  },
  {
    ticker: 'TSLA',
    name: 'Tesla',
    sector: 'Consumer',
    type: 'stock',
    price: 250,
    change24h: 8.5,
    rsi14: null,
    aboveMa50: null,
  },
];

describe('buildScreeningPrompt', () => {
  it('should include candidates and watchlist info', () => {
    const prompt = buildScreeningPrompt(mockCandidates, ['AAPL', 'MSFT'], ['AAPL']);
    expect(prompt).toContain('AAPL');
    expect(prompt).toContain('HELD POSITIONS');
    expect(prompt).toContain('CURRENT WATCHLIST');
    expect(prompt).toContain('10-30 titles');
  });

  it('should sort by absolute change', () => {
    const prompt = buildScreeningPrompt(mockCandidates, [], []);
    const tslaIdx = prompt.indexOf('TSLA');
    const aaplIdx = prompt.indexOf('AAPL');
    expect(tslaIdx).toBeLessThan(aaplIdx); // TSLA has 8.5% > AAPL 5.2%
  });
});

describe('parseScreeningResult', () => {
  it('should parse valid JSON response', () => {
    const json = JSON.stringify({
      selected: [
        { ticker: 'AAPL', reason: 'Overbought RSI' },
        { ticker: 'BTC', reason: 'Oversold bounce' },
      ],
      dropped: [{ ticker: 'MSFT', reason: 'No signals' }],
      summary: 'Market is volatile today.',
    });

    const result = parseScreeningResult(json, []);
    expect(result).not.toBeNull();
    expect(result!.selected).toHaveLength(2);
    expect(result!.summary).toContain('volatile');
  });

  it('should force-include held positions', () => {
    const json = JSON.stringify({
      selected: [{ ticker: 'BTC', reason: 'Oversold' }],
      dropped: [],
      summary: 'Calm market.',
    });

    const result = parseScreeningResult(json, ['AAPL']);
    expect(result!.selected.some((s) => s.ticker === 'AAPL')).toBe(true);
  });

  it('should return null for invalid JSON', () => {
    expect(parseScreeningResult('not json', [])).toBeNull();
  });

  it('should return null for empty selected array', () => {
    const json = JSON.stringify({ selected: [], dropped: [], summary: 'Nothing' });
    expect(parseScreeningResult(json, [])).toBeNull();
  });
});
