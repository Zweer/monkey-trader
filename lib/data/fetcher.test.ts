import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchHistory, fetchPrices } from './fetcher';
import type { Ticker } from './types';

vi.mock('./alpaca', () => ({
  fetchLatestQuotes: vi.fn(),
  fetchBars: vi.fn(),
}));

vi.mock('./binance', () => ({
  fetchTickerPrices: vi.fn(),
  fetchKlines: vi.fn(),
}));

import { fetchBars, fetchLatestQuotes } from './alpaca';
import { fetchKlines, fetchTickerPrices } from './binance';

const mockFetchQuotes = vi.mocked(fetchLatestQuotes);
const mockFetchBars = vi.mocked(fetchBars);
const mockFetchTickerPrices = vi.mocked(fetchTickerPrices);
const mockFetchKlines = vi.mocked(fetchKlines);

afterEach(() => {
  vi.resetAllMocks();
});

describe('fetchPrices', () => {
  it('should fetch stocks and crypto in parallel', async () => {
    mockFetchQuotes.mockResolvedValueOnce({
      success: true,
      data: [
        {
          ticker: 'AAPL',
          price: 150,
          volume: 0,
          timestamp: new Date(),
          source: 'alpaca',
          change24h: 0,
        },
      ],
    });
    mockFetchTickerPrices.mockResolvedValueOnce({
      success: true,
      data: [
        {
          ticker: 'BTC',
          price: 67000,
          volume: 15000,
          timestamp: new Date(),
          source: 'binance',
          change24h: 2.5,
        },
      ],
    });

    const tickers: Ticker[] = [
      { symbol: 'AAPL', type: 'stock' },
      { symbol: 'BTC', type: 'crypto' },
    ];

    const results = await fetchPrices(tickers);

    expect(results).toHaveLength(2);
    expect(results[0].ticker).toBe('AAPL');
    expect(results[1].ticker).toBe('BTC');
    expect(mockFetchQuotes).toHaveBeenCalledWith(['AAPL']);
    expect(mockFetchTickerPrices).toHaveBeenCalledWith(['BTC']);
  });

  it('should return crypto results if Alpaca fails', async () => {
    mockFetchQuotes.mockResolvedValueOnce({ success: false, error: 'Alpaca down' });
    mockFetchTickerPrices.mockResolvedValueOnce({
      success: true,
      data: [
        {
          ticker: 'BTC',
          price: 67000,
          volume: 15000,
          timestamp: new Date(),
          source: 'binance',
          change24h: 0,
        },
      ],
    });

    const tickers: Ticker[] = [
      { symbol: 'AAPL', type: 'stock' },
      { symbol: 'BTC', type: 'crypto' },
    ];

    const results = await fetchPrices(tickers);

    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('BTC');
  });

  it('should return stock results if Binance fails', async () => {
    mockFetchQuotes.mockResolvedValueOnce({
      success: true,
      data: [
        {
          ticker: 'AAPL',
          price: 150,
          volume: 0,
          timestamp: new Date(),
          source: 'alpaca',
          change24h: 0,
        },
      ],
    });
    mockFetchTickerPrices.mockResolvedValueOnce({ success: false, error: 'Binance down' });

    const tickers: Ticker[] = [
      { symbol: 'AAPL', type: 'stock' },
      { symbol: 'BTC', type: 'crypto' },
    ];

    const results = await fetchPrices(tickers);

    expect(results).toHaveLength(1);
    expect(results[0].ticker).toBe('AAPL');
  });

  it('should return empty array for empty tickers', async () => {
    const results = await fetchPrices([]);
    expect(results).toEqual([]);
  });
});

describe('fetchHistory', () => {
  it('should use fetchBars for stocks', async () => {
    mockFetchBars.mockResolvedValueOnce({
      success: true,
      data: [
        { open: 148, high: 152, low: 147, close: 150, volume: 1000000, timestamp: new Date() },
      ],
    });

    const result = await fetchHistory({ symbol: 'AAPL', type: 'stock' }, 7);

    expect(result).toHaveLength(1);
    expect(mockFetchBars).toHaveBeenCalledWith('AAPL', 7);
  });

  it('should use fetchKlines for crypto', async () => {
    mockFetchKlines.mockResolvedValueOnce({
      success: true,
      data: [
        {
          open: 67000,
          high: 68000,
          low: 66000,
          close: 67500,
          volume: 12000,
          timestamp: new Date(),
        },
      ],
    });

    const result = await fetchHistory({ symbol: 'BTC', type: 'crypto' }, 7);

    expect(result).toHaveLength(1);
    expect(mockFetchKlines).toHaveBeenCalledWith('BTC', 7);
  });

  it('should return empty array on failure', async () => {
    mockFetchBars.mockResolvedValueOnce({ success: false, error: 'timeout' });

    const result = await fetchHistory({ symbol: 'AAPL', type: 'stock' }, 7);

    expect(result).toEqual([]);
  });
});
