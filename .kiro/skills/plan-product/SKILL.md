---
name: plan-product
description: Product thinking mode — rethink the problem before coding. Use when starting a new feature or when the request is ambiguous.
---

# Plan Product

**Cognitive mode: Product Owner**

Don't build the ticket. Ask: "What problem is this really solving?"

## Trigger

Invoke with: `plan product`, `plan-product`, or `product thinking`

## Workflow

### 1. Redefine the Problem
- What did the user say?
- What is the underlying need?
- Where does the current solution fall short?

### 2. Ideal Version
- What would the user/trader experience look like if everything were perfect?
- Which steps can be eliminated or automated?

### 3. Pragmatic Version
- What is the MVP that still delivers real value?
- How many phases? What does each phase deliver?

### 4. Risks and Tradeoffs
- What is the biggest risk?
- What assumptions are we betting on?
- Cost implications (LLM calls, API limits, Vercel execution time)?

## Output Format

```markdown
# Product Plan: {topic}

## Problem Redefined
- Surface request: {what the user said}
- Real need: {underlying problem}

## Ideal Version
{describe the ideal experience}

## Pragmatic Plan
### Phase 1 (MVP)
{minimal but valuable}

### Phase 2
{next iteration}

## Risks
- {risk}: {mitigation}

## Decision
- Recommended direction: {one sentence}
- Next step: use `plan eng` to lock in the technical plan
```

## Principles
- Don't write code — this phase is product thinking only
- After finishing, suggest moving to `plan eng` for technical planning
- Keep it concise — one page max
