import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkRecentTick, resetTickCache, saveTickResult, type TickResult } from './idempotency';

const mockResult: TickResult = {
  tickId: 'test-123',
  timestamp: new Date().toISOString(),
  processed: 10,
  signalsStrong: 2,
  decisionsGenerated: 1,
  tradesExecuted: 1,
  autoTriggers: 0,
  durationMs: 5000,
};

beforeEach(() => {
  vi.useFakeTimers();
  resetTickCache();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('idempotency', () => {
  it('should return null when no previous tick', () => {
    expect(checkRecentTick()).toBeNull();
  });

  it('should return cached result within 5 minutes', () => {
    saveTickResult(mockResult);
    vi.advanceTimersByTime(60_000); // 1 min later
    expect(checkRecentTick()).toEqual(mockResult);
  });

  it('should return null after 5 minutes', () => {
    saveTickResult(mockResult);
    vi.advanceTimersByTime(5 * 60 * 1000 + 1); // 5min + 1ms
    expect(checkRecentTick()).toBeNull();
  });

  it('should update cache with new result', () => {
    saveTickResult(mockResult);
    const newResult = { ...mockResult, tickId: 'test-456', processed: 20 };
    saveTickResult(newResult);
    expect(checkRecentTick()!.tickId).toBe('test-456');
  });
});
