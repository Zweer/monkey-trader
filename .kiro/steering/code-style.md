# Code Style

## Language Policy

TypeScript is the only language. Never introduce other languages unless explicitly declared in the stack.

## TypeScript

### Strict Mode
- Always strict mode, no `any` — use `unknown` and narrow
- Explicit return types on exported functions
- ES modules only (`"type": "module"`)

### Naming
- **camelCase** for variables, functions, methods
- **PascalCase** for classes, interfaces, types, React components
- **UPPER_SNAKE_CASE** only for env vars and constants
- **kebab-case** for file names

### Code Organization
```typescript
// 1. External imports
// 2. Internal imports
// 3. Types/Interfaces
// 4. Constants
// 5. Implementation
```

### Quality
- Write only what's necessary — no premature abstractions
- No unused code, no commented-out code
- Prefer `const` over `let`, never `var`
- Use early returns to reduce nesting
- Prefer named exports over default exports
- `async/await` over `.then()/.catch()`
- Handle errors explicitly — no empty catch blocks

## Dependencies

- Search npm before writing custom code
- Prefer native Node.js APIs when possible
- Pin exact versions (no `^` or `~`)

## React / Next.js

- Server Components by default, `"use client"` only when needed
- Colocate components with their route when single-use
- Shared components in `app/components/`
- Data fetching in Server Components or API routes, never in client
