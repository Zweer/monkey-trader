import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchKlines, fetchTickerPrices } from './binance';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  mockFetch.mockReset();
});

describe('fetchTickerPrices', () => {
  it('should return normalized prices with 24h change', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { symbol: 'BTCUSDT', price: '67000.50' },
          { symbol: 'ETHUSDT', price: '3500.25' },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { symbol: 'BTCUSDT', priceChangePercent: '2.5', volume: '15000' },
          { symbol: 'ETHUSDT', priceChangePercent: '-1.2', volume: '80000' },
        ],
      });

    const result = await fetchTickerPrices(['BTC', 'ETH']);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].ticker).toBe('BTC');
    expect(result.data![0].price).toBe(67000.5);
    expect(result.data![0].change24h).toBe(2.5);
    expect(result.data![0].volume).toBe(15000);
    expect(result.data![0].source).toBe('binance');
    expect(result.data![1].ticker).toBe('ETH');
  });

  it('should return empty array for empty tickers', async () => {
    const result = await fetchTickerPrices([]);
    expect(result).toEqual({ success: true, data: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle price endpoint error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429, statusText: 'Too Many Requests' });

    const result = await fetchTickerPrices(['BTC']);

    expect(result.success).toBe(false);
    expect(result.error).toContain('429');
  });

  it('should handle network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'));

    const result = await fetchTickerPrices(['BTC']);

    expect(result.success).toBe(false);
    expect(result.error).toContain('aborted');
  });

  it('should throw for unknown ticker', async () => {
    await expect(fetchTickerPrices(['UNKNOWN'])).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('Unknown crypto ticker'),
    });
  });
});

describe('fetchKlines', () => {
  it('should return OHLCV data', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        [1717718400000, '67000', '68000', '66000', '67500', '12000', 0, '0', 0, '0', '0', '0'],
        [1717804800000, '67500', '69000', '67000', '68500', '15000', 0, '0', 0, '0', '0', '0'],
      ],
    });

    const result = await fetchKlines('BTC', 7);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].open).toBe(67000);
    expect(result.data![0].high).toBe(68000);
    expect(result.data![0].close).toBe(67500);
    expect(result.data![0].volume).toBe(12000);
  });

  it('should handle API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await fetchKlines('BTC', 7);

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });

  it('should throw for unknown ticker', async () => {
    await expect(fetchKlines('UNKNOWN', 7)).resolves.toMatchObject({
      success: false,
      error: expect.stringContaining('Unknown crypto ticker'),
    });
  });
});
