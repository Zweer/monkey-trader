CREATE TYPE "public"."action" AS ENUM('buy', 'sell', 'hold');--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('stock', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."data_source" AS ENUM('alpaca', 'binance');--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(20) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"action" "action" NOT NULL,
	"size_percent" numeric(5, 2) NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"reasoning" text NOT NULL,
	"model_used" varchar(30) NOT NULL,
	"price_at_decision" numeric(18, 8) NOT NULL,
	"stop_loss_percent" numeric(5, 2),
	"target_percent" numeric(5, 2),
	"executed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "indicators" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(20) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"rsi_14" numeric(8, 4),
	"macd_line" numeric(18, 8),
	"macd_signal" numeric(18, 8),
	"macd_histogram" numeric(18, 8),
	"ma_20" numeric(18, 8),
	"ma_50" numeric(18, 8),
	"ma_200" numeric(18, 8),
	"bb_upper" numeric(18, 8),
	"bb_middle" numeric(18, 8),
	"bb_lower" numeric(18, 8),
	"volume_sma_20" numeric(18, 2),
	"signal_score" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"portfolio_value" numeric(18, 2) NOT NULL,
	"cash" numeric(18, 2) NOT NULL,
	"daily_pnl" numeric(18, 2) NOT NULL,
	"daily_pnl_percent" numeric(8, 4) NOT NULL,
	"cumulative_pnl_percent" numeric(8, 4) NOT NULL,
	"benchmark_sp500" numeric(8, 4),
	"benchmark_btc" numeric(8, 4),
	CONSTRAINT "performance_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "portfolio" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(20) NOT NULL,
	"shares" numeric(18, 8) NOT NULL,
	"avg_entry_price" numeric(18, 8) NOT NULL,
	"current_price" numeric(18, 8) NOT NULL,
	"opened_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_state" (
	"id" serial PRIMARY KEY NOT NULL,
	"cash" numeric(18, 2) DEFAULT '10000.00' NOT NULL,
	"total_value" numeric(18, 2) NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "price_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(20) NOT NULL,
	"price" numeric(18, 8) NOT NULL,
	"volume" numeric(18, 2) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"source" "data_source" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticker" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" "asset_type" NOT NULL,
	"sector" varchar(50),
	"added_at" timestamp DEFAULT now() NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "watchlist_ticker_unique" UNIQUE("ticker")
);
