# Spec 01 — Foundation

## Vision

MonkeyTrader runs 24/7 with zero infrastructure cost. This spec sets up the entire skeleton: a deployable Next.js app on Vercel, a PostgreSQL database on Neon with the complete schema, authenticated cron endpoints triggered by GitHub Actions, and environment variable management.

## Goal

A deployed Next.js app with all tables created, a working `/api/tick` endpoint (returning 200 + auth check), and a GitHub Actions cron that hits it every 30 minutes.

## Requirements

### 1. Project Setup (Next.js)
- Next.js 15 with App Router, TypeScript strict mode
- Biome for linting/formatting
- Vitest for testing
- `package.json` scripts: dev, build, start, lint, format, test, db:generate, db:migrate, db:studio
- `.env.example` with all required env vars documented
- `.gitignore` covering node_modules, .next, .env*.local

### 2. Database Schema (Neon + Drizzle)
- Drizzle ORM with `drizzle-kit` for migrations
- PostgreSQL on Neon (free tier)
- Tables:

#### `watchlist`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| ticker | varchar(20) | unique |
| name | varchar(100) | |
| type | enum('stock','crypto') | |
| sector | varchar(50) | nullable |
| added_at | timestamp | default now() |
| active | boolean | default true |

#### `price_snapshots`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| ticker | varchar(20) | FK watchlist |
| price | decimal(18,8) | |
| volume | decimal(18,2) | |
| timestamp | timestamp | |
| source | enum('alpaca','binance') | |

#### `indicators`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| ticker | varchar(20) | FK watchlist |
| timestamp | timestamp | |
| rsi_14 | decimal(8,4) | nullable |
| macd_line | decimal(18,8) | nullable |
| macd_signal | decimal(18,8) | nullable |
| macd_histogram | decimal(18,8) | nullable |
| ma_20 | decimal(18,8) | nullable |
| ma_50 | decimal(18,8) | nullable |
| ma_200 | decimal(18,8) | nullable |
| bb_upper | decimal(18,8) | nullable |
| bb_middle | decimal(18,8) | nullable |
| bb_lower | decimal(18,8) | nullable |
| volume_sma_20 | decimal(18,2) | nullable |
| signal_score | integer | 0-5, number of aligned signals |

#### `decisions`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| ticker | varchar(20) | FK watchlist |
| timestamp | timestamp | |
| action | enum('buy','sell','hold') | |
| size_percent | decimal(5,2) | % of portfolio |
| confidence | decimal(3,2) | 0.0–1.0 |
| reasoning | text | full LLM output |
| model_used | varchar(30) | 'flash' or 'pro' |
| price_at_decision | decimal(18,8) | |
| stop_loss_percent | decimal(5,2) | nullable |
| target_percent | decimal(5,2) | nullable |
| executed | boolean | default false |

#### `portfolio`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| ticker | varchar(20) | FK watchlist |
| shares | decimal(18,8) | |
| avg_entry_price | decimal(18,8) | |
| current_price | decimal(18,8) | |
| opened_at | timestamp | |
| updated_at | timestamp | |

#### `portfolio_state`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | (single row) |
| cash | decimal(18,2) | default 10000.00 |
| total_value | decimal(18,2) | |
| updated_at | timestamp | |

#### `performance`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| date | date | unique |
| portfolio_value | decimal(18,2) | |
| cash | decimal(18,2) | |
| daily_pnl | decimal(18,2) | |
| daily_pnl_percent | decimal(8,4) | |
| cumulative_pnl_percent | decimal(8,4) | |
| benchmark_sp500 | decimal(8,4) | nullable |
| benchmark_btc | decimal(8,4) | nullable |

### 3. Authentication (Cron Endpoints)
- All `POST /api/*` endpoints require `Authorization: Bearer <TICK_SECRET>` header
- Return 401 if missing or wrong
- Shared auth utility in `lib/auth.ts`
- Dashboard GET endpoints are public (no auth)

### 4. GitHub Actions Cron
- `.github/workflows/cron.yml`
- Jobs:
  - `tick`: every 30 minutes, `curl -X POST` with bearer token, `--max-time 5`
  - `screen`: daily at 09:00 UTC (before US market open)
  - `rebalance`: weekly on Sunday at 20:00 UTC
- Fire-and-forget: does NOT wait for response body
- Uses repository secret `TICK_SECRET` and `VERCEL_URL`

### 5. Health Check
- `GET /api/health` — returns `{ status: "ok", timestamp, db: "connected"|"error" }`
- Verifies DB connectivity

## Technical Constraints

- Vercel Hobby plan (free): 60s max function execution
- Neon free tier: 0.5 GB storage, auto-suspend
- GitHub Actions: fire-and-forget only (2s per trigger)
- All secrets in env vars via Vercel dashboard

## Success Criteria

- `npm run build` succeeds
- `npm run lint` passes
- `npm test` passes (at least auth util tested)
- `/api/health` returns 200 with DB connected
- `/api/tick` returns 401 without token, 200 with valid token
- GitHub Actions cron triggers successfully
- All tables exist in Neon

## Non-Goals (for this spec)

- Actual tick logic (just auth + 200 stub)
- Market data fetching
- Indicator calculation
- LLM integration
- Dashboard UI
