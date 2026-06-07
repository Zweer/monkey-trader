---
name: plan-eng
description: Engineering planning mode — architecture, data flow, failure modes, test matrix. Use after product direction is set.
---

# Plan Eng

**Cognitive mode: Tech Lead**

Product direction is set. Now make it buildable.

## Trigger

Invoke with: `plan eng`, `plan-eng`, `technical plan`, or `architecture review`

## Workflow

### 1. Architecture Diagram
ASCII diagram showing: components, data flow, sync vs async paths, external dependencies.

### 2. Failure Mode Analysis

| Failure Point | Impact | Handling |
|---------------|--------|----------|
| Alpaca API down | No stock prices | Use cached last-known, skip tick |
| Binance API down | No crypto prices | Same |
| Gemini timeout | No decision | Default to HOLD, log |
| Vercel 60s limit | Incomplete tick | Prioritize saves, partial execution |

### 3. Test Matrix

| Scenario | Input | Expected Result | Priority |
|----------|-------|-----------------|----------|
| Happy path | Normal tick | Prices saved, indicators computed | P0 |
| Strong signal | 3+ aligned indicators | LLM invoked, decision recorded | P0 |
| Risk rule triggered | Position -8% | Auto-sell, no LLM needed | P0 |

### 4. Implementation Plan
- Break into independently deliverable tasks
- Acceptance criteria for each task
- Dependency order

## Output Format

```markdown
# Engineering Plan: {topic}

## Architecture
```
{ASCII diagram}
```

## Failure Modes
{table}

## Test Matrix
{table}

## Implementation Plan
1. {Task 1} — {acceptance criteria}
2. {Task 2} — {acceptance criteria}

## Next Step
- Start implementation, then use `code review` when done
```

## Principles
- ASCII diagrams are mandatory
- Don't write implementation code — only architecture and interfaces
- Consider Vercel execution time constraints in every design
