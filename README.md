# MonkeyTrader 🐒📈

AI-powered paper trading bot + dashboard. A hybrid agent (algorithmic indicators + LLM reasoning) that monitors stocks and crypto 24/7, makes simulated trading decisions, and tracks performance over time.

**Live:** [monkeytrader.vercel.app](https://monkeytrader.vercel.app)  
**Repo:** Public (no secrets in code — all keys in env vars)

---

## Project Vision

The goal is NOT to beat the market. The goal is to build a system that:

1. **Takes motivated decisions** — every buy/sell comes with explicit reasoning
2. **Tracks what would have happened** — simulated P&L if it had executed its own decisions
3. **Shows everything on a dashboard** — real price vs predicted, portfolio performance vs benchmark, full decision log with reasoning
4. **Runs 24/7 autonomously** — no human intervention needed for routine operation
5. **Costs nearly nothing** — leveraging free tiers everywhere, only paying for LLM calls

The "monkey" in the name is a nod to the classic finance joke: "a monkey throwing darts at stock picks can beat most fund managers." Let's see if an AI monkey does any better.

---

## Architecture Decisions & Reasoning

### Why Hybrid (Algorithms + LLM)?

Pure algorithmic trading is fast but dumb — it can't reason about macro context, news, or complex situations. Pure LLM trading is expensive (tokens per call) and slow (2-10 seconds per response). The hybrid approach:

- **Algorithmic layer** runs every tick: calculates technical indicators (RSI, MACD, Moving Averages, Bollinger Bands, Volume). This is instant and free.
- **LLM layer** runs only when signals are strong: receives the algorithmic signals + portfolio state + rules, and makes the actual decision with reasoning.

This means ~80% of ticks are handled purely algorithmically ("nothing interesting, skip"), and the LLM is only invoked when there's something worth deciding on. Saves money, saves time.

### Why GitHub Actions + Vercel (not a VPS)?

We need 24/7 operation at zero infrastructure cost.

- **GitHub Actions** (cron every 30 min): fires a single `curl` POST to the Vercel endpoint. Takes ~2 seconds. Fire-and-forget (does NOT wait for computation to finish). This uses ~48 minutes/month of Actions time — well within the free tier for public repos (3000 min/month).
- **Vercel** (Hobby plan, free): handles all the actual computation in a serverless function. Max 60 seconds execution time on free tier. Our full flow (fetch prices + calculate indicators + call Gemini + save to DB) takes ~20-40 seconds — it fits.

**Why not just GitHub Actions for everything?** Because Actions minutes add up if the job runs for 30+ seconds. By making Actions just a 2-second trigger, we keep it negligible.

**Why not Vercel Cron Jobs?** Free tier only allows minimum 1/day frequency. We need every 30 minutes.

### Why Gemini (Pay-per-Use)?

- No subscription needed (unlike ChatGPT Plus or Claude Pro)
- Pay only for what you use — perfect for variable-frequency calls
- **Flash** for routine decisions (cheap: ~$0.15/1M input tokens)
- **Pro** for complex analysis like daily screening and weekly rebalancing (~$1.25/1M input tokens)
- Estimated cost: **$5-10/month** total

### Why Both Stocks AND Crypto?

- **Crypto** (top 10 by market cap): Market open 24/7 → agent can be tested and observed at any time. Free APIs (Binance). More frequent movements = more decisions to analyze = more interesting dashboard.
- **US Stocks** (via Alpaca paper trading): More stable, more data available, more "traditional" trading signals apply. Tests whether the agent works on calmer assets too.

Running both gives us two portfolios to compare, and the agent can be evaluated on different asset types.

### Why Neon (PostgreSQL)?

- Already familiar with it from other Vercel projects
- Free tier: 0.5 GB storage, 190 compute hours/month (auto-suspends)
- More than enough for years of trading decisions on 30 titles
- PostgreSQL = can do complex queries on performance data easily

### Why Alpaca for Stocks?

- Free paper trading account with real market data (IEX)
- API identical to real trading → if we ever go live, minimal code changes
- No broker account funding needed
- 200 req/min on free tier — plenty for 30 titles every 30 min

### Why 10-30 Titles?

Starting small. With 30 titles checked every 30 min:
- ~720 potential LLM calls/day if ALL ticks had strong signals
- Realistically ~100-200 calls/day (most ticks are quiet)
- Fits within Gemini free/cheap usage
- Enough diversity to test the agent's decision-making across sectors

### Why $10K Virtual Portfolio?

Only percentages matter for evaluation. $10K is round, easy to reason about, and standard for paper trading demos. The dashboard will show both absolute $ and % returns.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│         GitHub Actions (cron every 30 min)                │
│                                                          │
│   curl -X POST /api/tick --max-time 5                    │
│   (fire-and-forget, ~2 seconds, doesn't wait)            │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Vercel (Next.js App)                         │
│                                                          │
│  POST /api/tick  (every 30 min, triggered by Actions)    │
│    1. Fetch current prices (Alpaca + Binance)            │
│    2. Calculate technical indicators                      │
│    3. Evaluate signal strength                           │
│    4. If weak → save snapshot, stop (~5 sec)             │
│    5. If strong → call Gemini Flash for decision         │
│    6. Apply hard risk management rules                   │
│    7. Record decision + reasoning in DB (~20-40 sec)     │
│                                                          │
│  POST /api/screen  (daily, separate Actions cron)        │
│    - Scan broader universe (S&P 100 + crypto top 30)     │
│    - Gemini Pro selects 10-30 most interesting titles    │
│    - Updates watchlist                                    │
│                                                          │
│  POST /api/rebalance  (weekly)                           │
│    - Gemini Pro reviews entire watchlist + portfolio      │
│    - Suggests structural changes                         │
│                                                          │
│  GET  /api/portfolio                                     │
│  GET  /api/decisions                                     │
│  GET  /api/performance                                   │
│                                                          │
│  Dashboard (client-rendered):                            │
│    - Portfolio overview + allocation chart                │
│    - Per-title price chart with buy/sell markers          │
│    - Agent prediction vs reality                         │
│    - Decision log with full reasoning                    │
│    - Performance scorecard                               │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Neon (PostgreSQL, free tier)                 │
│                                                          │
│  watchlist         → titles currently monitored          │
│  price_snapshots   → price at each tick (for charts)     │
│  indicators        → calculated RSI/MACD/etc per tick    │
│  decisions         → buy/sell/hold + reasoning + price   │
│  portfolio         → current positions + cash balance    │
│  performance       → daily P&L, cumulative returns       │
└─────────────────────────────────────────────────────────┘
```

### Adaptive Frequency

Not all ticks need the same attention:

| Market condition | Check frequency | LLM involvement |
|-----------------|----------------|-----------------|
| Calm (no signals) | Every 2 hours | None (algorithmic only) |
| Interesting signals | Every 30 min | Gemini Flash |
| High volatility event | Every 30 min | Gemini Pro |
| Crypto overnight (low activity) | Every 4 hours | None unless signals |

This keeps LLM costs low while staying responsive when it matters.

---

## The Agent: How It Decides

### Technical Indicators (Algorithmic Layer)

Calculated on every tick, instant, free:

| Indicator | What it tells us |
|-----------|-----------------|
| **MA (Moving Average)** 20/50/200 | Trend direction. Price above MA = bullish. |
| **RSI (Relative Strength Index)** | Momentum. <30 = oversold (may bounce). >70 = overbought (may drop). |
| **MACD** | Trend changes. When fast MA crosses slow MA = potential reversal. |
| **Bollinger Bands** | Volatility. Price outside bands = unusual move. |
| **Volume** | Confirmation. High volume + price move = real trend. Low volume = noise. |

### Signal Strength Evaluation

After calculating indicators, the algorithmic layer produces a "signal score":
- 0-2 signals aligned → **weak** → skip LLM, just save snapshot
- 3+ signals aligned → **strong** → invoke LLM for decision

### LLM Decision (Gemini Flash / Pro)

The LLM receives a structured prompt containing:
- Current signals for the title
- Current portfolio state (positions, cash, exposure)
- Recent price history (last 7 days)
- Risk management rules (hard constraints it must respect)
- Recent decisions on this title (avoid flip-flopping)

It responds with:
```json
{
  "action": "buy" | "sell" | "hold",
  "ticker": "AAPL",
  "size_percent": 5,
  "confidence": 0.7,
  "reasoning": "RSI at 28 with volume spike suggests oversold bounce. MA50 support confirmed. Allocating 5% given moderate confidence.",
  "stop_loss": -8,
  "target": 12
}
```

### When to Use Pro vs Flash

| Situation | Model | Why |
|-----------|-------|-----|
| Routine tick with strong signal | Flash | Simple decision, clear signals |
| Daily screening (choose watchlist) | Pro | Needs broader reasoning about macro |
| Weekly rebalance | Pro | Complex portfolio-wide analysis |
| Conflicting signals + high volatility | Pro | Needs nuanced judgment |

---

## Risk Management (Hard Rules)

These are enforced in CODE, not by the LLM. The LLM cannot override them.

### Allocation Limits
- Max **20%** of portfolio on any single title
- Max **40%** on any single sector/category
- Min **30%** in "safe" assets (BTC/ETH for crypto, blue chips for stocks)
- Max **30%** in speculative positions (small cap, altcoins)

### Position Rules
- **Stop loss**: -8% on any position → automatic sell
- **Take profit (partial)**: +15% → sell half the position
- **Trailing stop**: if position reaches +20%, then drops 5% from peak → sell
- **Max hold without review**: 2 weeks → force re-analysis by Pro model

### Exposure Rules
- Max **70%** invested at any time, min **30%** cash (to seize opportunities)
- If portfolio drops **10% in one week** → defensive mode (only hold/sell, no new buys)

### Operational Rules
- Max **3 trades per day** (avoid overtrading)
- **Bias toward inaction**: if uncertain, do nothing
- **No excessive correlation**: can't buy 5 altcoins in the same session
- **Minimum position size**: 3% (no dust positions)

---

## Dashboard Sections

### 1. Portfolio Overview
- Current positions with weight %, entry price, current price, P&L per position
- Cash balance and total portfolio value
- Allocation pie chart (by sector/category)

### 2. Portfolio Performance (Chart)
- Line chart: portfolio value over time
- Overlaid benchmarks: S&P 500 (for stocks portion), BTC hold (for crypto portion)
- Visual comparison: "how would buy-and-hold have done vs. the agent"

### 3. Per-Title View
- TradingView Lightweight Charts (free, professional-looking)
- Buy/sell markers overlaid on price chart
- Agent's predicted direction vs actual outcome

### 4. Decision Log
- Chronological timeline of every decision
- Each entry shows: action, title, size, price at decision time, reasoning (full LLM output)
- Color-coded: green (profitable), red (loss), gray (pending)

### 5. Scorecard / Analytics
- Win rate (% of decisions that were profitable)
- Average gain vs average loss
- Sharpe ratio (risk-adjusted return)
- Max drawdown
- Best/worst single decision
- Comparison vs benchmarks

---

## Cost Breakdown

| Component | Monthly Cost | Notes |
|-----------|-------------|-------|
| GitHub Actions | $0 | Public repo, ~50 min/month used |
| Vercel Hobby | $0 | Well within free tier limits |
| Neon Free | $0 | 0.5 GB storage, auto-suspend |
| Alpaca (stocks data) | $0 | Free paper trading + IEX data |
| Binance (crypto data) | $0 | Free API, generous limits |
| Gemini Flash (~200 calls/day) | ~$3-5 | Routine decisions |
| Gemini Pro (~10 calls/day) | ~$2-5 | Screening + complex decisions |
| **Total** | **~$5-10/month** | Only LLM usage costs money |

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js (App Router) | Full-stack in one project, Vercel-native |
| Database | Neon (PostgreSQL) | Free, familiar, complex queries |
| ORM | TBD (Drizzle?) | Type-safe, lightweight |
| LLM (routine) | Gemini 2.5 Flash | Cheap, fast, pay-per-use |
| LLM (complex) | Gemini 2.5 Pro | Smart, pay-per-use |
| Stock data | Alpaca API | Free paper trading + real data |
| Crypto data | Binance API | Free, real-time, generous |
| Technical indicators | TBD (ta.js or similar) | Needs evaluation |
| Charts | TradingView Lightweight Charts | Free, professional, embeddable |
| Cron trigger | GitHub Actions | Free, reliable, fire-and-forget |
| Hosting | Vercel | Free tier sufficient |

---

## Environment Variables

```env
# Auth (shared secret between GitHub Actions and Vercel)
TICK_SECRET=               # Bearer token to authenticate cron calls

# Gemini (Google AI Studio)
GEMINI_API_KEY=

# Alpaca (paper trading)
ALPACA_API_KEY=
ALPACA_SECRET_KEY=

# Binance (read-only, for crypto prices)
BINANCE_API_KEY=

# Database
DATABASE_URL=              # Neon PostgreSQL connection string
```

---

## Open Design Questions (for next session)

These are NOT decided yet and need discussion:

1. **DB schema** — exact table structure, indexes, relations
2. **API contracts** — request/response shapes for each endpoint
3. **Prompt engineering** — exact prompt templates for Flash and Pro
4. **Indicator library** — which JS/TS lib for technical analysis
5. **ORM choice** — Drizzle vs Kysely vs raw SQL
6. **Chart implementation** — TradingView Lightweight vs alternatives
7. **Agent "personality"** — conservative vs aggressive default stance
8. **Screening criteria** — what makes a title "interesting" for the watchlist
9. **Backtesting** — do we want to backtest the strategy on historical data before going live?

---

## TODO

- [ ] Create GitHub repo (public)
- [ ] Setup Next.js project
- [ ] Setup Neon database + schema
- [ ] Implement `/api/tick` (core loop)
- [ ] Implement `/api/screen` (daily watchlist selection)
- [ ] Technical indicators library integration
- [ ] Gemini integration (Flash + Pro routing)
- [ ] Risk management engine (hard rules)
- [ ] Dashboard: portfolio overview
- [ ] Dashboard: per-title charts with decision markers
- [ ] Dashboard: decision log
- [ ] Dashboard: performance scorecard
- [ ] GitHub Actions cron workflow
- [ ] Deploy to Vercel
- [ ] First live paper trading run 🐒
