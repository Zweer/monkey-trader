# Architecture

## Overview

MonkeyTrader is a serverless paper trading system: GitHub Actions triggers Vercel endpoints, which fetch market data, compute indicators, optionally invoke Gemini for decisions, and persist everything to Neon PostgreSQL.

## System Flow

```
GitHub Actions (cron 30min)
  │ curl POST /api/tick (fire-and-forget, 2s)
  ▼
Vercel Serverless Function (max 60s)
  │
  ├─ Fetch prices (Alpaca + Binance)
  ├─ Calculate technical indicators
  ├─ Evaluate signal strength
  │   ├─ Weak → save snapshot, stop
  │   └─ Strong → invoke Gemini
  ├─ Apply hard risk rules
  └─ Record decision + reasoning → Neon
```

## Endpoints

| Route | Trigger | Purpose |
|-------|---------|---------|
| `POST /api/tick` | Every 30 min | Core trading loop |
| `POST /api/screen` | Daily | Watchlist selection (Gemini Pro) |
| `POST /api/rebalance` | Weekly | Portfolio review (Gemini Pro) |
| `GET /api/portfolio` | Dashboard | Current positions |
| `GET /api/decisions` | Dashboard | Decision log |
| `GET /api/performance` | Dashboard | P&L and metrics |

## Database (Neon PostgreSQL)

| Table | Purpose |
|-------|---------|
| `watchlist` | Titles currently monitored |
| `price_snapshots` | Price at each tick (for charts) |
| `indicators` | Calculated RSI/MACD/etc per tick |
| `decisions` | Buy/sell/hold + reasoning + price |
| `portfolio` | Current positions + cash balance |
| `performance` | Daily P&L, cumulative returns |

## LLM Routing

- **Gemini Flash**: routine tick decisions (strong signals, simple context)
- **Gemini Pro**: daily screening, weekly rebalance, conflicting signals

## Key Constraints

- Vercel free tier: 60s max execution time
- Full tick flow must complete in ~20-40s
- GitHub Actions: fire-and-forget (does NOT wait for response)
- All secrets in env vars, never in code
