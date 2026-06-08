import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeBudget } from './budget';

describe('TimeBudget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with full budget', () => {
    const budget = new TimeBudget(10000);
    expect(budget.elapsed()).toBe(0);
    expect(budget.remaining()).toBe(10000);
    expect(budget.isExpired()).toBe(false);
  });

  it('should track elapsed time', () => {
    const budget = new TimeBudget(10000);
    vi.advanceTimersByTime(3000);
    expect(budget.elapsed()).toBe(3000);
    expect(budget.remaining()).toBe(7000);
  });

  it('should report expired when limit reached', () => {
    const budget = new TimeBudget(5000);
    vi.advanceTimersByTime(5000);
    expect(budget.isExpired()).toBe(true);
    expect(budget.remaining()).toBe(0);
  });

  it('should check if enough time for operation', () => {
    const budget = new TimeBudget(10000);
    vi.advanceTimersByTime(7000);
    expect(budget.canProceed(2000)).toBe(true);
    expect(budget.canProceed(5000)).toBe(false);
  });

  it('should use 55s default limit', () => {
    const budget = new TimeBudget();
    expect(budget.remaining()).toBe(55000);
  });
});
