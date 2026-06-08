import { describe, expect, it } from 'vitest';

import { enrichWithHistory } from './quick-scan';

describe('enrichWithHistory', () => {
  it('should compute RSI and MA50 position for uptrend', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5);
    const result = enrichWithHistory(
      {
        ticker: 'AAPL',
        name: 'Apple',
        sector: 'Tech',
        type: 'stock',
        price: 130,
        change24h: 1,
        rsi14: null,
        aboveMa50: null,
      },
      closes,
    );
    expect(result.rsi14).not.toBeNull();
    expect(result.rsi14!).toBeGreaterThan(50);
    expect(result.aboveMa50).toBe(true);
  });

  it('should detect below MA50 in downtrend', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 200 - i * 0.5);
    const result = enrichWithHistory(
      {
        ticker: 'AAPL',
        name: 'Apple',
        sector: 'Tech',
        type: 'stock',
        price: 170,
        change24h: -2,
        rsi14: null,
        aboveMa50: null,
      },
      closes,
    );
    expect(result.rsi14).not.toBeNull();
    expect(result.aboveMa50).toBe(false);
  });

  it('should handle insufficient data gracefully', () => {
    const result = enrichWithHistory(
      {
        ticker: 'X',
        name: 'X',
        sector: 'Y',
        type: 'stock',
        price: 102,
        change24h: 0,
        rsi14: null,
        aboveMa50: null,
      },
      [100, 101, 102],
    );
    expect(result.rsi14).toBeNull();
    expect(result.aboveMa50).toBeNull();
  });

  it('should handle exactly enough data for RSI but not MA50', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = enrichWithHistory(
      {
        ticker: 'X',
        name: 'X',
        sector: 'Y',
        type: 'stock',
        price: 120,
        change24h: 0,
        rsi14: null,
        aboveMa50: null,
      },
      closes,
    );
    expect(result.rsi14).not.toBeNull();
    expect(result.aboveMa50).toBeNull(); // need 50 bars for MA50
  });
});
