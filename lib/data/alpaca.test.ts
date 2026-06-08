import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchBars, fetchLatestQuotes } from './alpaca';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.stubEnv('ALPACA_API_KEY', 'test-key');
  vi.stubEnv('ALPACA_SECRET_KEY', 'test-secret');
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockFetch.mockReset();
});

describe('fetchLatestQuotes', () => {
  it('should return normalized quotes on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        quotes: {
          AAPL: { ap: 150.1, bp: 150.0, as: 100, bs: 200, t: '2026-06-08T14:00:00Z' },
          MSFT: { ap: 400.2, bp: 400.0, as: 50, bs: 100, t: '2026-06-08T14:00:00Z' },
        },
      }),
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
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API error response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, statusText: 'Forbidden' });

    const result = await fetchLatestQuotes(['AAPL']);

    expect(result.success).toBe(false);
    expect(result.error).toContain('403');
  });

  it('should handle network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('The operation was aborted'));

    const result = await fetchLatestQuotes(['AAPL']);

    expect(result.success).toBe(false);
    expect(result.error).toContain('aborted');
  });

  it('should send correct auth headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ quotes: {} }),
    });

    await fetchLatestQuotes(['AAPL']);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('stocks/quotes/latest'),
      expect.objectContaining({
        headers: {
          'APCA-API-KEY-ID': 'test-key',
          'APCA-API-SECRET-KEY': 'test-secret',
        },
      }),
    );
  });
});

describe('fetchBars', () => {
  it('should return OHLCV data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bars: {
          AAPL: [
            { o: 148, h: 152, l: 147, c: 150, v: 1000000, t: '2026-06-07T04:00:00Z' },
            { o: 150, h: 153, l: 149, c: 151, v: 900000, t: '2026-06-08T04:00:00Z' },
          ],
        },
      }),
    });

    const result = await fetchBars('AAPL', 7);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data![0].open).toBe(148);
    expect(result.data![0].close).toBe(150);
    expect(result.data![0].volume).toBe(1000000);
  });

  it('should handle missing symbol in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bars: {} }),
    });

    const result = await fetchBars('AAPL', 7);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should handle API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const result = await fetchBars('AAPL', 7);

    expect(result.success).toBe(false);
    expect(result.error).toContain('500');
  });
});
