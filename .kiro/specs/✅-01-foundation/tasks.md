# Spec 01 — Foundation Tasks

## Dependency Order

```
T1 (Project Setup) → T2 (DB Schema) → T3 (Auth Util) → T4 (API Stubs) → T5 (GitHub Actions) → T6 (Deploy)
```

## T1 — Project Setup

- [ ] `npx create-next-app@latest` with App Router, TypeScript, Tailwind, no src dir
- [ ] Add Biome (`biome.json`: single quotes, trailing commas, semicolons)
- [ ] Add Vitest (`vitest.config.ts` with v8 coverage)
- [ ] Add Drizzle ORM + drizzle-kit + `@neondatabase/serverless`
- [ ] Create `.env.example` with all vars documented
- [ ] Create `.editorconfig`
- [ ] Configure `tsconfig.json` strict mode
- [ ] Verify: `npm run build` succeeds

**Acceptance:** Clean Next.js project builds, lint passes, test runner works.

## T2 — Database Schema

- [ ] Create `db/schema.ts` with all tables (watchlist, price_snapshots, indicators, decisions, portfolio, portfolio_state, performance)
- [ ] Create `db/index.ts` (Drizzle client with Neon serverless driver)
- [ ] Create `drizzle.config.ts`
- [ ] Run `npm run db:generate` to produce migration
- [ ] Run `npm run db:migrate` against Neon
- [ ] Verify: all tables exist in Neon console

**Acceptance:** `db:migrate` succeeds, schema matches requirements spec.

## T3 — Auth Utility

- [ ] Create `lib/auth.ts`: `verifyTickSecret(request: Request): boolean`
- [ ] Reads `Authorization: Bearer <token>` and compares to `TICK_SECRET` env var
- [ ] Create `lib/auth.test.ts`: test valid token, invalid token, missing header
- [ ] Verify: `npm test` passes

**Acceptance:** Auth utility correctly validates bearer token, 100% test coverage on this file.

## T4 — API Route Stubs

- [ ] `POST /api/tick` — auth check → return `{ status: "ok", message: "tick stub" }`
- [ ] `POST /api/screen` — auth check → return `{ status: "ok", message: "screen stub" }`
- [ ] `POST /api/rebalance` — auth check → return `{ status: "ok", message: "rebalance stub" }`
- [ ] `GET /api/health` — check DB connection → return `{ status, timestamp, db }`
- [ ] `GET /api/portfolio` — return `{ positions: [], cash: 10000, total: 10000 }` (stub)
- [ ] `GET /api/decisions` — return `{ decisions: [] }` (stub)
- [ ] `GET /api/performance` — return `{ daily: [], cumulative: 0 }` (stub)
- [ ] Verify: auth rejects without token, accepts with valid token

**Acceptance:** All endpoints respond correctly. POST endpoints require auth. GET endpoints are public.

## T5 — GitHub Actions Cron

- [ ] Create `.github/workflows/cron.yml`
- [ ] Job `tick`: `cron: '*/30 * * * *'`, curl POST with `--max-time 5`
- [ ] Job `screen`: `cron: '0 9 * * *'`
- [ ] Job `rebalance`: `cron: '0 20 * * 0'`
- [ ] Use `${{ secrets.TICK_SECRET }}` and `${{ vars.VERCEL_URL }}`
- [ ] Add `workflow_dispatch` for manual triggers
- [ ] Verify: workflow syntax valid (`actionlint` or push test)

**Acceptance:** Workflow file passes validation, can be triggered manually.

## T6 — Deploy & Verify

- [ ] Push to GitHub
- [ ] Vercel auto-deploys
- [ ] Set env vars in Vercel dashboard
- [ ] Verify `/api/health` returns `{ db: "connected" }`
- [ ] Verify `/api/tick` rejects without auth
- [ ] Trigger GitHub Actions manually, confirm it hits the endpoint
- [ ] Verify Neon dashboard shows tables

**Acceptance:** Full stack deployed and working end-to-end.
