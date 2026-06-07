# Build & Tooling

## Package Manager

- **npm** (no yarn, no pnpm)
- Lock file: `package-lock.json`

## Build System

- **Next.js** handles compilation and bundling
- No separate build step needed for app code
- Drizzle Kit for DB migrations

### Scripts
```bash
npm run dev              # next dev (local development)
npm run build            # next build (production build)
npm run start            # next start (production server)
npm run lint             # biome check .
npm run format           # biome format --write .
npm test                 # vitest run
npm run test:watch       # vitest (watch mode)
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:studio        # drizzle-kit studio
```

## Linting & Formatting

- **Biome** for linting and formatting (NOT ESLint/Prettier)
- Single quotes, trailing commas, semicolons
- Configuration in `biome.json` at root

## Deployment

- **Vercel** auto-deploys from main branch
- Preview deployments on PRs
- Environment variables configured in Vercel dashboard
