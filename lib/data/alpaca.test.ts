import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetStocksQuotesLatest = vi.fn();
const mockGetStocksBars = vi.fn();

vi.mock('@alpacahq/typescript-sdk', () => ({
  createClient: () => ({
    getStocksQuotesLatest: mockGetStocksQuotesLatest,
    getStocksBars: mockGetStocksBars,
  }),
}));

import { fetchBars, fetchLatestQuotes } from './alpaca';

beforeEach(() => {
  vi.stubEnv('ALPACA_API_KEY', 'test-key');
  vi.stubEnv('ALPACA_SECRET_KEY', 'test-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockGetStocksQuotesLatest.mockReset();
  mockGetStocksBars.mockReset();
});

describe('fetchLatestQuotes', () => {
  it('should return normalized quotes on success', async () => {
    mockGetStocksQuotesLatest.mockResolvedValueOnce({
      AAPL: { ap: 150.1, bp: 150.0, t: '2026-06-08T14:00:00Z' },
      MSFT: { ap: 400.2, bp: 400.0, t: '2026-06-08T14:00:00Z' },
    });

    const result = await fetchLatestQuotes(['AAPL', 'MSFT']);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].ticker).toBe('AAPL');
    expect(result.data![0].price).toBeCloseTo(150.05);
    expect(result.data![0].source).toBe('alpaca');
  });

  it('should return empty array for empty symbols', async () => {
    const result = await fetchLatestQuotes([]);
    expect(result).toEqual({ success: true, data: [] });
    expect(mockGetStocksQuotesLatest).not.toHaveBeenCalled();
  });

  it('should handle API error', async () => {
    mockGetStocksQuotesLatest.mockRejectedValueOnce(new Error('Forbidden'));

    const result = await fetchLatestQuotes(['AAPL']);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Forbidden');
  });
});

describe('fetchBars', () => {
  it('should return OHLCV data on success', async () => {
    mockGetStocksBars.mockResolvedValueOnce({
      AAPL: [
        { o: 148, h: 152, l: 147, c: 150, v: 1000000, t: '2026-06-07T04:00:00Z' },
        { o: 150, h: 153, l: 149, c: 151, v: 900000, t: '2026-06-08T04:00:00Z' },
      ],
    });

    const result = await fetchBars('AAPL', 7);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].open).toBe(148);
    expect(result.data![0].close).toBe(150);
  });

  it('should handle missing symbol in response', async () => {
    mockGetStocksBars.mockResolvedValueOnce({});

    const result = await fetchBars('AAPL', 7);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle API error', async () => {
    mockGetStocksBars.mockRejectedValueOnce(new Error('Internal Server Error'));

    const result = await fetchBars('AAPL', 7);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Internal Server Error');
  });
});
