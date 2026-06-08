import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeBudget } from './budget';
import { type CashState, executeBuy, executeSell } from './execute-trade';
import { checkRecentTick, resetTickCache, saveTickResult, type TickResult } from './idempotency';

describe('tick flow integration', () => {
  describe('idempotency in flow', () => {
    beforeEach(() => {
      resetTickCache();
    });

    it('should skip processing when cached result exists', () => {
      const cached: TickResult = {
        tickId: 'cached-123',
        timestamp: new Date().toISOString(),
        processed: 10,
        signalsStrong: 2,
        decisionsGenerated: 1,
        tradesExecuted: 1,
        autoTriggers: 0,
        durationMs: 5000,
      };
      saveTickResult(cached);

      const result = checkRecentTick();
      expect(result).toEqual(cached);
    });
  });

  describe('trade + budget integration', () => {
    it('should execute buy and respect budget', () => {
      const budget = new TimeBudget(55000);
      const cash: CashState = { cash: 10000 };

      // Simulate decision flow
      expect(budget.canProceed(6000)).toBe(true);

      const result = executeBuy(
        {
          action: 'buy',
          ticker: 'AAPL',
          sizePercent: 5,
          confidence: 0.8,
          reasoning: 'test',
          stopLossPercent: -8,
          targetPercent: 12,
          timeHorizon: '3d',
        },
        150,
        10000,
        cash,
      );

      expect(result.executed).toBe(true);
      expect(cash.cash).toBe(9500);
    });

    it('should handle full sell flow', () => {
      const cash: CashState = { cash: 5000 };
      const position = { ticker: 'BTC', shares: 0.5, avgEntryPrice: 60000 };
      // position value = 0.5 * 55000 = 27500, portfolioValue = 10000
      // to sell all: sizePercent must cover full value → 275% but capped to shares
      const result = executeSell(
        {
          action: 'sell',
          ticker: 'BTC',
          sizePercent: 50,
          confidence: 1,
          reasoning: 'stop loss',
          stopLossPercent: 0,
          targetPercent: 0,
          timeHorizon: 'immediate',
        },
        55000,
        55000, // totalPortfolioValue includes position
        cash,
        position,
      );

      expect(result.executed).toBe(true);
      expect(position.shares).toBe(0);
      expect(cash.cash).toBe(5000 + 0.5 * 55000);
    });

    it('should stop LLM calls when budget exhausted', () => {
      const budget = new TimeBudget(100); // very short budget

      // Simulate time passing
      const decisions: string[] = [];
      const tickers = ['AAPL', 'MSFT', 'GOOGL', 'BTC', 'ETH'];

      for (const ticker of tickers) {
        if (!budget.canProceed(6000)) {
          break;
        }
        decisions.push(ticker);
      }

      // Should not process any since budget is 100ms < 6000ms needed
      expect(decisions).toHaveLength(0);
    });
  });
});
