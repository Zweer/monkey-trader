import { describe, expect, it } from 'vitest';

import { isMarketOpen } from './market-hours';

describe('isMarketOpen', () => {
  it('should return true during market hours (Tuesday 10:00 ET)', () => {
    // 2026-06-09 Tuesday 10:00 ET = 14:00 UTC
    const date = new Date('2026-06-09T14:00:00Z');
    expect(isMarketOpen(date)).toBe(true);
  });

  it('should return false before market open (Tuesday 9:00 ET)', () => {
    // 2026-06-09 Tuesday 9:00 ET = 13:00 UTC
    const date = new Date('2026-06-09T13:00:00Z');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('should return false after market close (Tuesday 16:30 ET)', () => {
    // 2026-06-09 Tuesday 16:30 ET = 20:30 UTC
    const date = new Date('2026-06-09T20:30:00Z');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('should return false on Saturday', () => {
    // 2026-06-13 Saturday 12:00 ET = 16:00 UTC
    const date = new Date('2026-06-13T16:00:00Z');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('should return false on Sunday', () => {
    // 2026-06-14 Sunday 12:00 ET = 16:00 UTC
    const date = new Date('2026-06-14T16:00:00Z');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('should return false on US holiday (Juneteenth 2026)', () => {
    // 2026-06-19 Friday 12:00 ET = 16:00 UTC
    const date = new Date('2026-06-19T16:00:00Z');
    expect(isMarketOpen(date)).toBe(false);
  });

  it('should return true at market open exactly (9:30 ET)', () => {
    // 2026-06-09 Tuesday 9:30 ET = 13:30 UTC
    const date = new Date('2026-06-09T13:30:00Z');
    expect(isMarketOpen(date)).toBe(true);
  });

  it('should return false at market close exactly (16:00 ET)', () => {
    // 2026-06-09 Tuesday 16:00 ET = 20:00 UTC
    const date = new Date('2026-06-09T20:00:00Z');
    expect(isMarketOpen(date)).toBe(false);
  });
});
