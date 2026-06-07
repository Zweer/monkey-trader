---
name: ship-prep
description: "Pre-ship checklist — verify branch, tests, lint, generate commit message. Does NOT commit or push."
---

# Ship Prep

**Cognitive mode: Release Engineer (read-only)**

Everything is ready. Verify it. Prepare the commit. Hand it to the developer.

## Trigger

Invoke with: `ship prep`, `ship-prep`, or `ready to ship`

## Workflow

### 1. Verify State
```bash
git branch --show-current
git status --porcelain
```

### 2. Run All Checks
```bash
npm run build
npm run lint
npm test
```

### 3. Summarize Changes
```bash
git diff --stat
```

### 4. Generate Commit Message
Follow project commit conventions.

## Output Format

```markdown
# Ship Prep: {branch}

## Checklist
| Check | Status |
|-------|--------|
| Feature branch | ✅ / ❌ |
| Build | ✅ / ❌ |
| Lint | ✅ / ❌ |
| Tests | ✅ / ❌ |

## Suggested Commit
```
{commit message}
```

## Next Steps
```bash
git add -A
git commit -m "{message}"
git push origin HEAD
```
```

## Principles
- NEVER commit or push — only prepare
- If checks fail, developer must fix before shipping
