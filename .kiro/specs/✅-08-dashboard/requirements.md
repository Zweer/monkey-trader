# Spec 08 — Dashboard

## Vision

The dashboard is the public face of MonkeyTrader — it shows what the agent is doing, why it's doing it, and how it's performing. It's the proof that the system works (or doesn't). Fully client-rendered, free-tier friendly, professional-looking.

## Goal

A responsive dashboard with: portfolio overview, price charts with trade markers, full decision log with reasoning, and a performance scorecard comparing against benchmarks.

## Requirements

### 1. Layout & Navigation
- Single-page app feel (Next.js App Router with client components)
- Top nav: Portfolio | Charts | Decisions | Scorecard
- Mobile-responsive (works on phone)
- Dark theme (trading aesthetic)
- No auth required (public read-only dashboard)

### 2. Portfolio Overview (Home)
- Summary cards:
  - Total portfolio value
  - Cash available
  - Daily P&L ($ and %)
  - Win rate (% profitable decisions)
- Position table:
  | Ticker | Type | Shares | Entry | Current | P&L % | Weight % |
- Allocation pie chart (by sector/type)
- Defensive mode indicator (if active)

### 3. Per-Title Charts
- Use **TradingView Lightweight Charts** (free, embeddable, professional)
- Candlestick chart from `price_snapshots` data
- Overlays:
  - Moving averages (MA20, MA50 as lines)
  - Bollinger Bands (shaded area)
- Markers:
  - Green triangle (up) = buy decision
  - Red triangle (down) = sell decision
  - Yellow dot = hold with strong signal
- Tooltip on marker: date, action, confidence, reasoning preview
- Ticker selector dropdown (from watchlist)
- Time range: 7d, 30d, 90d, All

### 4. Decision Log
- Chronological timeline (newest first)
- Each entry:
  - Timestamp
  - Action badge: BUY (green) / SELL (red) / HOLD (gray)
  - Ticker + price at decision
  - Confidence bar (0-100%)
  - Reasoning (expandable text — full LLM output)
  - Model used (Flash/Pro badge)
  - Risk verdict (approved/rejected/downsized)
  - Outcome (if position since closed): +X% or -X%
- Filters: by ticker, by action, by date range
- Pagination: 20 per page

### 5. Performance Scorecard
- Key metrics:
  - Total return (% since inception)
  - Annualized return
  - Win rate (% of trades that were profitable)
  - Average win vs average loss
  - Profit factor (gross profit / gross loss)
  - Max drawdown (peak-to-trough)
  - Sharpe ratio (if enough data)
  - Total trades executed
- Chart: portfolio value over time vs benchmarks
  - Line 1: MonkeyTrader portfolio
  - Line 2: S&P 500 buy-and-hold (from inception)
  - Line 3: BTC buy-and-hold (from inception)
- Best/worst decision (with link to full reasoning)
- Monthly breakdown table

### 6. API Endpoints (Data)
- `GET /api/portfolio` — current positions + cash + summary
- `GET /api/decisions?page=1&limit=20&ticker=&action=` — paginated decision log
- `GET /api/performance` — scorecard metrics + daily series
- `GET /api/chart-data?ticker=AAPL&range=30d` — OHLCV + indicators + markers for chart
- All public (no auth), read-only
- JSON responses with proper typing

### 7. Real-Time Indicators
- Status bar showing:
  - Last tick: "3 minutes ago" (relative time)
  - Next tick: "in 27 minutes"
  - Active tickers: 24/30
  - Today's trades: 2/3
  - Agent status: "Running" / "Defensive Mode" / "Market Closed"

## Technical Constraints

- Client-side rendering for charts (TradingView Lightweight requires DOM)
- Server Components for data fetching (Next.js App Router)
- No WebSocket/real-time updates (data refreshes on page load or manual refresh)
- TradingView Lightweight Charts: ~40KB gzipped (acceptable)
- Must work on Vercel free tier (static + serverless)
- No paid UI component library — Tailwind + custom only

## Success Criteria

- Dashboard loads in < 3s on 3G
- Charts render correctly with trade markers
- Decision log is filterable and paginated
- Scorecard shows correct metrics (verified against raw DB data)
- Mobile responsive (usable on 375px width)
- Accessible: proper contrast, screen reader labels, keyboard nav
- All API endpoints return correct data shapes

## Non-Goals (for this spec)

- User accounts / personalized views
- Real-time streaming updates
- Alerting / notifications
- Portfolio simulator ("what if" scenarios)
- PDF/export of reports
- Social features (sharing trades)
