# Commit Conventions

**IMPORTANT**: The agent NEVER commits, pushes, or creates tags. The developer handles all git operations.

## Format

Conventional commits with gitmoji as text (not emoji):

```
type(scope): :emoji_code: short description

Detailed explanation of what and why.
```

## Types

- `feat` — New feature (`:sparkles:`)
- `fix` — Bug fix (`:bug:`)
- `perf` — Performance (`:zap:`)
- `docs` — Documentation (`:memo:`)
- `chore` — Maintenance (`:wrench:`, `:arrow_up:`, `:bookmark:`)
- `refactor` — Refactoring (`:recycle:`)
- `test` — Tests (`:white_check_mark:`)
- `style` — Formatting (`:art:`)
- `ci` — CI/CD (`:construction_worker:`)
- `build` — Build system (`:hammer:`)

## Scopes

- `tick` — Core tick loop
- `screen` — Daily screening
- `rebalance` — Weekly rebalance
- `indicators` — Technical analysis
- `risk` — Risk management engine
- `agent` — LLM decision logic
- `dashboard` — Frontend/charts
- `db` — Schema/migrations
- `api` — API routes
- `infra` — GitHub Actions, Vercel config

## Rules

- One scope per commit
- Always use text codes (`:sparkles:`), never actual emoji (✨)
- Always include a body explaining what and why
- Breaking changes: add `!` after type/scope + `BREAKING CHANGE:` in body
