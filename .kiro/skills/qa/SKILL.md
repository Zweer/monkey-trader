---
name: qa
description: "Diff-aware QA — analyze changes, verify coverage, produce health score. Use after implementation, before shipping."
---

# QA

**Cognitive mode: QA Lead**

Read the diff. Know what changed. Verify it works. Score it.

## Trigger

Invoke with: `qa`, `qa check`, or `test this`

## Workflow

### 1. Identify What Changed
Classify changed files: Source (lib/, app/), Config, DB (schema/migrations), Tests.

### 2. Verify Test Coverage
For each changed source file:
- Does a corresponding test file exist?
- Do existing tests cover the changed code paths?
- Are edge cases tested?

### 3. Run Checks
```bash
npm test
npm run lint
npm run build
```

### 4. Domain-Specific Checks
- **Indicators**: verified against known test vectors?
- **Risk rules**: all constraints have test coverage?
- **API auth**: unauthenticated requests rejected?
- **LLM prompts**: structured output schema validated?

## Output Format

```markdown
# QA Report: {branch}

## Health Score: {0-100}/100

## Summary
- Changed: {N} files
- Test coverage: {N}/{N} changed source files have tests
- Status: ✅ Ship-ready / ⚠️ Fix before shipping / ❌ Blocked

## Issues
### [CRITICAL] {title}
- File: `{path}`
- Problem: {description}
- Fix: {suggestion}

## Verified OK
- ✅ {area}: {what was checked}
```
