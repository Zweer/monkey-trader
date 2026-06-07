# Spec 04 — Agent & LLM Tasks

## Dependency Order

```
T1 (Gemini Client) → T2 (Prompt Builder) → T3 (Output Validation) → T4 (Model Router) → T5 (Agent Orchestrator) → T6 (Integration Test)
```

## T1 — Gemini Client

- [ ] Create `lib/agent/gemini.ts`
- [ ] Initialize Flash and Pro model instances from `@google/generative-ai`
- [ ] Implement `callGemini(model: 'flash' | 'pro', prompt: string, systemPrompt: string): Promise<string>`
- [ ] JSON mode enabled (structured output)
- [ ] 30s timeout, error wrapping
- [ ] Test: mock SDK, verify correct model selected, timeout handled

**Acceptance:** Client correctly calls Flash or Pro, handles timeout and API errors.

## T2 — Prompt Builder

- [ ] Create `lib/agent/prompts.ts`
- [ ] Implement `buildTickPrompt(context: TickContext): string`
- [ ] Context includes: ticker, price, indicators, portfolio state, risk rules, recent decisions
- [ ] System prompt as constant (agent personality)
- [ ] Keep prompt under ~2000 tokens for Flash efficiency
- [ ] Test: verify prompt includes all required sections

**Acceptance:** Generated prompt contains all context fields, stays under token budget.

## T3 — Output Validation

- [ ] Create `lib/agent/validate.ts`
- [ ] Implement `parseDecision(raw: string): AgentDecision | null`
- [ ] Validate: action enum, sizePercent 0-20, confidence 0-1, required fields present
- [ ] Strip markdown fences if present (```json...```)
- [ ] Test: valid JSON passes, invalid fields rejected, malformed JSON returns null

**Acceptance:** Valid responses parsed correctly. Invalid responses return null without throwing.

## T4 — Model Router

- [ ] Create `lib/agent/router.ts`
- [ ] Implement `selectModel(context: DecisionContext): 'flash' | 'pro'`
- [ ] Rules: signal strength, volatility, task type (tick vs screen vs rebalance)
- [ ] Test: verify routing logic for all scenarios

**Acceptance:** Correct model selected for each scenario. Default is Flash.

## T5 — Agent Orchestrator

- [ ] Create `lib/agent/index.ts`
- [ ] Implement `getDecision(context: TickContext): Promise<AgentDecision>`
- [ ] Flow: build prompt → select model → call Gemini → validate → retry if invalid → fallback to hold
- [ ] Anti-flip-flop: check last decision timestamp, skip if < 2h
- [ ] Confidence gate: if < 0.5, override to hold
- [ ] Save decision to `decisions` table
- [ ] Test: full flow with mocked Gemini (success, retry, fallback)

**Acceptance:** Returns valid decision in all cases (including LLM failure). Saves to DB.

## T6 — Integration Test

- [ ] Create `scripts/test-agent.ts`
- [ ] Build real context (fake portfolio + real indicators)
- [ ] Call Gemini Flash with real API key
- [ ] Print decision + reasoning
- [ ] Verify response matches schema

**Acceptance:** Real Gemini call returns valid, motivated decision with reasoning.
