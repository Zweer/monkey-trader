import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { portfolio, portfolioState, watchlist } from '@/db/schema';
import { getDecision } from '@/lib/agent';
import type { AgentDecision, TickContext } from '@/lib/agent/types';
import { fetchPrices } from '@/lib/data/fetcher';
import { savePriceSnapshots } from '@/lib/data/persist';
import type { PriceResult, Ticker } from '@/lib/data/types';
import { computeIndicators } from '@/lib/indicators';
import { saveIndicators } from '@/lib/indicators/persist';
import { checkAutoTriggers, checkRisk } from '@/lib/risk';
import type { PortfolioState } from '@/lib/risk/types';

import { TimeBudget } from './budget';
import { executeBuy, executeSell } from './execute-trade';
import { checkRecentTick, saveTickResult, type TickResult } from './idempotency';
import { updatePortfolioState, upsertDailyPerformance } from './portfolio-update';

const LLM_BUDGET_MS = 6000; // estimated per LLM call
const MAX_LLM_CALLS = 5;

export async function runTick(): Promise<TickResult> {
  const budget = new TimeBudget();
  const tickId = crypto.randomUUID();
  const warnings: string[] = [];

  console.log(`[TICK] started: ${tickId}`);

  // Idempotency check
  const cached = checkRecentTick();
  if (cached) {
    console.log(`[TICK] duplicate detected, returning cached result`);
    return cached;
  }

  const db = getDb();

  // 1. Load watchlist
  const tickers = await db
    .select({ ticker: watchlist.ticker, type: watchlist.type })
    .from(watchlist)
    .where(eq(watchlist.active, true));

  const tickerList: Ticker[] = tickers.map((t) => ({
    symbol: t.ticker,
    type: t.type as 'stock' | 'crypto',
  }));

  // 2. Fetch prices
  const prices = await fetchPrices(tickerList);
  console.log(`[FETCH] ${prices.length} prices fetched in ${budget.elapsed()}ms`);

  // 3. Save snapshots
  await savePriceSnapshots(db, prices);

  const priceMap = new Map<string, PriceResult>(prices.map((p) => [p.ticker, p]));

  // 4. Compute indicators for each ticker
  const strongSignals: Array<{ ticker: Ticker; price: PriceResult; score: number }> = [];

  for (const ticker of tickerList) {
    const price = priceMap.get(ticker.symbol);
    if (!price) continue;

    // Use current price as single-point history (indicators need history from DB in real flow)
    const indicators = computeIndicators(
      [
        {
          open: price.price,
          high: price.price,
          low: price.price,
          close: price.price,
          volume: price.volume,
          timestamp: price.timestamp,
        },
      ],
      price.price,
      price.volume,
    );

    await saveIndicators(db, ticker.symbol, indicators);
    console.log(
      `[SIGNAL] ${ticker.symbol} score=${indicators.signalScore} direction=${indicators.direction}`,
    );

    if (indicators.signalScore >= 3) {
      strongSignals.push({ ticker, price, score: indicators.signalScore });
    }
  }

  // 5. Load portfolio state
  const posRows = await db.select().from(portfolio);
  const stateRows = await db.select().from(portfolioState).limit(1);
  const cash = stateRows.length > 0 ? Number(stateRows[0].cash) : 10000;
  const totalValue = stateRows.length > 0 ? Number(stateRows[0].totalValue) : 10000;

  // 6. Auto-triggers
  const positions = posRows.map((p) => ({
    ticker: p.ticker,
    type: 'stock' as const,
    sector: 'unknown',
    shares: Number(p.shares),
    avgEntryPrice: Number(p.avgEntryPrice),
    currentPrice: Number(p.currentPrice),
    pnlPercent:
      ((Number(p.currentPrice) - Number(p.avgEntryPrice)) / Number(p.avgEntryPrice)) * 100,
    peakPrice: Number(p.currentPrice), // simplified
    portfolioPercent:
      totalValue > 0 ? ((Number(p.shares) * Number(p.currentPrice)) / totalValue) * 100 : 0,
    daysSinceEntry: Math.floor((Date.now() - p.openedAt.getTime()) / 86400000),
  }));

  const autoDecisions = checkAutoTriggers(positions);
  let tradesExecuted = 0;
  const cashState = { cash };

  // Execute auto-triggers
  for (const decision of autoDecisions) {
    const pos = posRows.find((p) => p.ticker === decision.ticker);
    if (pos) {
      executeSell(decision, Number(pos.currentPrice), totalValue, cashState, {
        ticker: pos.ticker,
        shares: Number(pos.shares),
        avgEntryPrice: Number(pos.avgEntryPrice),
      });
      tradesExecuted++;
      console.log(`[TRADE] auto ${decision.ticker} sell — ${decision.reasoning}`);
    }
  }

  // 7. LLM decisions for strong signals
  let decisionsGenerated = 0;
  const sortedSignals = strongSignals.sort((a, b) => b.score - a.score);

  const portfolioContext: PortfolioState = {
    cash: cashState.cash,
    totalValue,
    investedPercent: totalValue > 0 ? ((totalValue - cashState.cash) / totalValue) * 100 : 0,
    positions,
    dailyTradeCount: tradesExecuted,
    todaySectorTrades: {},
    recentSells: [],
    weeklyPerformance: 0,
    isDefensiveMode: false,
  };

  for (const { ticker, price } of sortedSignals.slice(0, MAX_LLM_CALLS)) {
    if (!budget.canProceed(LLM_BUDGET_MS)) {
      warnings.push(
        `Time budget exceeded — skipped ${sortedSignals.length - decisionsGenerated} LLM calls`,
      );
      console.log(`[TICK] budget exhausted, skipping remaining LLM calls`);
      break;
    }

    const context: TickContext = {
      ticker: ticker.symbol,
      currentPrice: price.price,
      change24h: price.change24h,
      indicators: computeIndicators(
        [
          {
            open: price.price,
            high: price.price,
            low: price.price,
            close: price.price,
            volume: price.volume,
            timestamp: price.timestamp,
          },
        ],
        price.price,
        price.volume,
      ),
      portfolio: {
        cash: cashState.cash,
        totalValue,
        positions: positions.map((p) => ({
          ticker: p.ticker,
          shares: p.shares,
          avgEntryPrice: p.avgEntryPrice,
          currentPrice: p.currentPrice,
          pnlPercent: p.pnlPercent,
        })),
      },
      recentDecisions: [],
      taskType: 'tick',
    };

    const decision = await getDecision(context);
    decisionsGenerated++;
    console.log(`[AGENT] ${ticker.symbol} → ${decision.action} confidence=${decision.confidence}`);

    if (decision.action !== 'hold') {
      const verdict = checkRisk(decision, portfolioContext);
      console.log(`[RISK] ${ticker.symbol} → ${verdict.action} ${verdict.reason}`);

      if (verdict.approved) {
        const adjustedDecision: AgentDecision = { ...decision, sizePercent: verdict.adjustedSize };
        if (adjustedDecision.action === 'buy') {
          executeBuy(adjustedDecision, price.price, totalValue, cashState);
        } else {
          const pos = posRows.find((p) => p.ticker === ticker.symbol);
          if (pos) {
            executeSell(adjustedDecision, price.price, totalValue, cashState, {
              ticker: pos.ticker,
              shares: Number(pos.shares),
              avgEntryPrice: Number(pos.avgEntryPrice),
            });
          }
        }
        tradesExecuted++;
        console.log(
          `[TRADE] ${decision.action} ${ticker.symbol} ${verdict.adjustedSize}% at $${price.price}`,
        );
      }
    }
  }

  // 8. Update portfolio state
  const positionsForUpdate = posRows.map((p) => ({
    shares: Number(p.shares),
    currentPrice: Number(priceMap.get(p.ticker)?.price ?? p.currentPrice),
  }));
  const { totalValue: newTotal } = await updatePortfolioState(
    db,
    cashState.cash,
    positionsForUpdate,
  );
  await upsertDailyPerformance(db, newTotal, cashState.cash, totalValue);

  const durationMs = budget.elapsed();
  console.log(`[TICK] completed in ${durationMs}ms`);

  const result: TickResult = {
    tickId,
    timestamp: new Date().toISOString(),
    processed: tickerList.length,
    signalsStrong: strongSignals.length,
    decisionsGenerated,
    tradesExecuted,
    autoTriggers: autoDecisions.length,
    durationMs,
    ...(warnings.length > 0 ? { warnings } : {}),
  };

  saveTickResult(result);
  return result;
}
