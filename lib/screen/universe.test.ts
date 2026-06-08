import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchCryptoUniverse, getFullUniverse, SP100 } from './universe';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

describe('SP100', () => {
  it('should have ~100 entries', () => {
    expect(SP100.length).toBeGreaterThanOrEqual(95);
    expect(SP100.length).toBeLessThanOrEqual(105);
  });

  it('should all be type stock', () => {
    expect(SP100.every((t) => t.type === 'stock')).toBe(true);
  });
});

describe('fetchCryptoUniverse', () => {
  it('should return top 30 by volume excluding stablecoins', async () => {
    const mockData = [
      { symbol: 'BTCUSDT', quoteVolume: '5000000000' },
      { symbol: 'ETHUSDT', quoteVolume: '3000000000' },
      { symbol: 'USDCUSDT', quoteVolume: '4000000000' }, // excluded
      { symbol: 'SOLUSDT', quoteVolume: '1000000000' },
      { symbol: 'WBTCUSDT', quoteVolume: '900000000' }, // excluded
      { symbol: 'DOGEUSDT', quoteVolume: '800000000' },
    ];
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => mockData });

    const result = await fetchCryptoUniverse();

    expect(result.find((t) => t.symbol === 'USDC')).toBeUndefined();
    expect(result.find((t) => t.symbol === 'WBTC')).toBeUndefined();
    expect(result.find((t) => t.symbol === 'BTC')).toBeDefined();
    expect(result.find((t) => t.symbol === 'ETH')).toBeDefined();
    expect(result.every((t) => t.type === 'crypto')).toBe(true);
  });

  it('should return empty array on fetch failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network'));
    const result = await fetchCryptoUniverse();
    expect(result).toEqual([]);
  });
});

describe('getFullUniverse', () => {
  it('should combine stocks and crypto', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { symbol: 'BTCUSDT', quoteVolume: '5000000000' },
        { symbol: 'ETHUSDT', quoteVolume: '3000000000' },
      ],
    });

    const universe = await getFullUniverse();
    expect(universe.length).toBeGreaterThan(95);
    expect(universe.some((t) => t.type === 'crypto')).toBe(true);
    expect(universe.some((t) => t.type === 'stock')).toBe(true);
  });
});
