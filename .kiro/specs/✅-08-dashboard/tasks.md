# Spec 08 — Dashboard Tasks

## Dependency Order

```
T1 (API Endpoints) → T2 (Layout + Nav) → T3 (Portfolio Overview) → T4 (Charts) → T5 (Decision Log) → T6 (Scorecard) → T7 (Polish)
```

## T1 — API Endpoints

- [ ] Implement `GET /api/portfolio`: query positions + portfolio_state, return formatted JSON
- [ ] Implement `GET /api/decisions`: paginated query with filters (ticker, action, date range)
- [ ] Implement `GET /api/performance`: compute metrics from `performance` + `decisions` tables
- [ ] Implement `GET /api/chart-data`: OHLCV from price_snapshots + indicator overlays + decision markers
- [ ] Test: verify response shapes, pagination, empty state

**Acceptance:** All endpoints return correct data. Empty portfolio returns valid empty-state JSON.

## T2 — Layout & Navigation

- [ ] Create app layout: dark theme, top navigation (Portfolio, Charts, Decisions, Scorecard)
- [ ] Responsive: mobile hamburger menu or bottom nav
- [ ] Status bar component: last tick time, next tick countdown, agent status
- [ ] Tailwind dark theme configuration
- [ ] Loading skeletons for async data

**Acceptance:** Navigation works on desktop and mobile. Dark theme consistent.

## T3 — Portfolio Overview

- [ ] Summary cards component: total value, cash, daily P&L, win rate
- [ ] Position table component: sortable columns (ticker, P&L, weight)
- [ ] Allocation pie chart (use a lightweight chart lib or CSS-based)
- [ ] Defensive mode banner (conditional)
- [ ] Fetch data via `GET /api/portfolio`

**Acceptance:** Portfolio page shows current state with correct numbers. Empty state handled.

## T4 — Per-Title Charts

- [ ] Install `lightweight-charts` (TradingView)
- [ ] Create reusable chart component (`"use client"`)
- [ ] Candlestick series from OHLCV data
- [ ] Line overlays: MA20, MA50
- [ ] Area overlay: Bollinger Bands
- [ ] Markers: buy (green), sell (red), hold-strong (yellow)
- [ ] Tooltip on marker hover (action, confidence, reasoning preview)
- [ ] Ticker selector dropdown
- [ ] Time range selector (7d, 30d, 90d, All)
- [ ] Fetch data via `GET /api/chart-data?ticker=X&range=Y`

**Acceptance:** Chart renders with real price data, overlays visible, markers clickable.

## T5 — Decision Log

- [ ] Timeline component: list of decision cards
- [ ] Decision card: timestamp, action badge, ticker, confidence bar, reasoning (expand/collapse)
- [ ] Filters: ticker dropdown, action type, date range picker
- [ ] Pagination (20 per page)
- [ ] Outcome indicator on closed positions (P&L since decision)
- [ ] Fetch data via `GET /api/decisions`

**Acceptance:** Decisions displayed chronologically, filterable, reasoning expandable.

## T6 — Performance Scorecard

- [ ] Metrics grid: total return, win rate, avg win/loss, max drawdown, trades count
- [ ] Performance chart: portfolio line vs S&P 500 vs BTC (3 lines)
- [ ] Best/worst decision highlight cards
- [ ] Monthly breakdown table (month, return %, trades, win rate)
- [ ] Fetch data via `GET /api/performance`

**Acceptance:** All metrics mathematically correct. Chart shows clear comparison vs benchmarks.

## T7 — Polish & Accessibility

- [ ] Lighthouse audit: performance > 90, accessibility > 90
- [ ] Keyboard navigation for all interactive elements
- [ ] Screen reader labels on charts and cards
- [ ] Proper contrast ratios (WCAG AA)
- [ ] Error states: API failure shows friendly message
- [ ] Empty states: "No trades yet", "Waiting for first tick"
- [ ] Meta tags: title, description, OG image for sharing

**Acceptance:** Lighthouse scores pass. App usable with keyboard only. Mobile works at 375px.
