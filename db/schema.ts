import {
  boolean,
  date,
  decimal,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const assetTypeEnum = pgEnum('asset_type', ['stock', 'crypto']);
export const dataSourceEnum = pgEnum('data_source', ['alpaca', 'binance']);
export const actionEnum = pgEnum('action', ['buy', 'sell', 'hold']);

export const watchlist = pgTable('watchlist', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 20 }).unique().notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: assetTypeEnum('type').notNull(),
  sector: varchar('sector', { length: 50 }),
  addedAt: timestamp('added_at').defaultNow().notNull(),
  active: boolean('active').default(true).notNull(),
});

export const priceSnapshots = pgTable('price_snapshots', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 20 }).notNull(),
  price: decimal('price', { precision: 18, scale: 8 }).notNull(),
  volume: decimal('volume', { precision: 18, scale: 2 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  source: dataSourceEnum('source').notNull(),
});

export const indicators = pgTable('indicators', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 20 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  rsi14: decimal('rsi_14', { precision: 8, scale: 4 }),
  macdLine: decimal('macd_line', { precision: 18, scale: 8 }),
  macdSignal: decimal('macd_signal', { precision: 18, scale: 8 }),
  macdHistogram: decimal('macd_histogram', { precision: 18, scale: 8 }),
  ma20: decimal('ma_20', { precision: 18, scale: 8 }),
  ma50: decimal('ma_50', { precision: 18, scale: 8 }),
  ma200: decimal('ma_200', { precision: 18, scale: 8 }),
  bbUpper: decimal('bb_upper', { precision: 18, scale: 8 }),
  bbMiddle: decimal('bb_middle', { precision: 18, scale: 8 }),
  bbLower: decimal('bb_lower', { precision: 18, scale: 8 }),
  volumeSma20: decimal('volume_sma_20', { precision: 18, scale: 2 }),
  signalScore: integer('signal_score').default(0).notNull(),
});

export const decisions = pgTable('decisions', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 20 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  action: actionEnum('action').notNull(),
  sizePercent: decimal('size_percent', { precision: 5, scale: 2 }).notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(),
  reasoning: text('reasoning').notNull(),
  modelUsed: varchar('model_used', { length: 30 }).notNull(),
  priceAtDecision: decimal('price_at_decision', { precision: 18, scale: 8 }).notNull(),
  stopLossPercent: decimal('stop_loss_percent', { precision: 5, scale: 2 }),
  targetPercent: decimal('target_percent', { precision: 5, scale: 2 }),
  executed: boolean('executed').default(false).notNull(),
});

export const portfolio = pgTable('portfolio', {
  id: serial('id').primaryKey(),
  ticker: varchar('ticker', { length: 20 }).notNull(),
  shares: decimal('shares', { precision: 18, scale: 8 }).notNull(),
  avgEntryPrice: decimal('avg_entry_price', { precision: 18, scale: 8 }).notNull(),
  currentPrice: decimal('current_price', { precision: 18, scale: 8 }).notNull(),
  openedAt: timestamp('opened_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const portfolioState = pgTable('portfolio_state', {
  id: serial('id').primaryKey(),
  cash: decimal('cash', { precision: 18, scale: 2 }).default('10000.00').notNull(),
  totalValue: decimal('total_value', { precision: 18, scale: 2 }).notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const performance = pgTable('performance', {
  id: serial('id').primaryKey(),
  date: date('date').unique().notNull(),
  portfolioValue: decimal('portfolio_value', { precision: 18, scale: 2 }).notNull(),
  cash: decimal('cash', { precision: 18, scale: 2 }).notNull(),
  dailyPnl: decimal('daily_pnl', { precision: 18, scale: 2 }).notNull(),
  dailyPnlPercent: decimal('daily_pnl_percent', { precision: 8, scale: 4 }).notNull(),
  cumulativePnlPercent: decimal('cumulative_pnl_percent', { precision: 8, scale: 4 }).notNull(),
  benchmarkSp500: decimal('benchmark_sp500', { precision: 8, scale: 4 }),
  benchmarkBtc: decimal('benchmark_btc', { precision: 8, scale: 4 }),
});
