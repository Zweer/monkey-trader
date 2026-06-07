# Spec 04 — Agent & LLM Integration

## Vision

The LLM is the "brain" of MonkeyTrader — invoked only when algorithmic signals are strong, it receives structured context and returns a motivated trading decision. The system uses Gemini Flash for routine decisions and Pro for complex analysis, keeping costs under $10/month.

## Goal

An agent module that takes indicator signals + portfolio state, builds a structured prompt, calls the appropriate Gemini model, and returns a validated trading decision with reasoning.

## Requirements

### 1. Gemini Client
- Use `@google/generative-ai` SDK
- Configure two model instances:
  - Flash (`gemini-2.5-flash`): routine tick decisions
  - Pro (`gemini-2.5-pro`): screening, rebalance, conflicting signals
- Environment variable: `GEMINI_API_KEY`
- Timeout: 30s per call
- Structured output (JSON mode) to avoid parsing issues

### 2. Model Routing
- Router function: `selectModel(context: DecisionContext): 'flash' | 'pro'`
- Rules:
  - Signal score 3-4, single ticker, clear direction → Flash
  - Signal score 5, conflicting history → Pro
  - Screening (multiple tickers, macro analysis) → Pro
  - Rebalance (portfolio-wide) → Pro
  - High volatility (daily change > 5%) → Pro
- Log which model was used for cost tracking

### 3. Prompt Engineering

#### Tick Decision Prompt (Flash/Pro)
Structured context includes:
- Ticker + current price + 24h change
- All indicator values + signal score + direction
- Current portfolio: positions, cash, total value, exposure %
- Risk rules summary (what the LLM must respect)
- Last 3 decisions on this ticker (avoid flip-flopping)
- Instruction: respond with structured JSON

#### System Prompt (shared)
```
You are MonkeyTrader, an AI paper trading agent. You analyze technical signals and make
motivated trading decisions. You are moderately conservative — you prefer inaction over
uncertain action. You never exceed the risk rules provided.

You MUST respond with valid JSON matching the schema. No prose, no explanation outside
the JSON structure.
```

### 4. Decision Schema (Output)
```typescript
type AgentDecision = {
  action: 'buy' | 'sell' | 'hold';
  ticker: string;
  sizePercent: number;       // 0-20, portfolio % to allocate
  confidence: number;        // 0.0-1.0
  reasoning: string;         // 2-4 sentences explaining why
  stopLossPercent: number;   // negative, e.g. -8
  targetPercent: number;     // positive, e.g. 12
  timeHorizon: string;       // e.g. "3-5 days", "1-2 weeks"
};
```

### 5. Output Validation
- Parse JSON response from Gemini
- Validate against schema (action is valid enum, sizePercent within 0-20, confidence 0-1)
- If invalid response: retry once with same prompt
- If second attempt fails: default to `hold` with `reasoning: "LLM response invalid"`
- Log all failures for debugging

### 6. Agent Personality
- **Moderately conservative**: prefers hold over uncertain trades
- **Bias toward inaction**: if confidence < 0.5, always hold
- **Anti-flip-flop**: if last decision on this ticker was < 2 hours ago, hold unless stop-loss triggered
- **Position builder**: prefers small entries (3-5%) over large ones

### 7. Cost Control
- Track token usage per call (input + output tokens)
- Estimated budget: ~200 Flash calls/day + ~10 Pro calls/day
- If Gemini returns 429 (rate limit): wait and retry once, then default to hold
- Log daily cost estimate in console

## Technical Constraints

- Gemini structured output (JSON mode) for reliable parsing
- 30s timeout per call (within the 60s Vercel budget)
- No streaming — wait for complete response
- Must handle Gemini API downtime gracefully (default to hold)

## Success Criteria

- Flash call completes in < 5s for routine decisions
- Pro call completes in < 15s for complex analysis
- Invalid LLM output is caught and handled (retry + fallback)
- Model routing correctly selects Flash vs Pro
- Prompt produces actionable, motivated decisions
- Anti-flip-flop logic prevents rapid contradictory trades
- Tests pass with mocked Gemini responses
- Decision saved to DB with full reasoning

## Non-Goals (for this spec)

- Multiple LLM providers (only Gemini)
- Fine-tuning or custom models
- Conversation memory across ticks (stateless per call)
- Image analysis (charts)
- News/sentiment analysis (future enhancement)
