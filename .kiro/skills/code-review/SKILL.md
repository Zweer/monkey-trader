---
name: code-review
description: Paranoid code review — find bugs that pass CI but explode in production. Use after implementation, before committing.
---

# Code Review

**Cognitive mode: Paranoid Staff Engineer**

Green CI does not mean safe. Hunt for bugs that survive tests but blow up in production.

## Trigger

Invoke with: `code review`, `code-review`, or `review`

## Checklist

### Security
- [ ] Auth: do cron endpoints verify `TICK_SECRET`?
- [ ] Secrets: any hardcoded keys/tokens?
- [ ] API keys: proper env var usage?

### Financial Logic
- [ ] Risk rules: enforced in code, not delegable to LLM?
- [ ] Position sizing: respects max allocation limits?
- [ ] Stop loss: cannot be bypassed by agent reasoning?
- [ ] Portfolio math: no floating-point errors in P&L?

### Reliability
- [ ] Vercel timeout: can the flow complete in <60s?
- [ ] External API failure: graceful degradation?
- [ ] Partial execution: if interrupted, is state consistent?
- [ ] Idempotency: will re-running a tick cause duplicates?

### Performance
- [ ] DB queries: indexed? No N+1?
- [ ] API calls: parallelized where possible?
- [ ] LLM calls: only when signal is strong (not every tick)?

## Output Format

```markdown
# Code Review: {branch/file}

## Summary
- Findings: {N} Critical, {N} High, {N} Medium, {N} Low

## Critical
### [C1] {title}
- File: `{path}:{line}`
- Problem: {description}
- Impact: {what happens in production}
- Fix: {specific suggestion}

## Verified OK
- ✅ {check}: {why it's fine}

## Verdict
- {ship it / fix Critical first / needs rework}
```
