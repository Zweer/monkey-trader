# Testing

## Framework

- **Vitest** for all tests (NOT Jest)
- Configuration in `vitest.config.ts` at root
- v8 coverage provider

## Structure

Test files colocated with source: `*.test.ts` next to the file being tested.

### Pattern (AAA)
```typescript
import { describe, it, expect } from 'vitest';

describe('FeatureName', () => {
  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Mocking

- Mock: external APIs (Alpaca, Binance, Gemini), network calls, database
- Don't mock: internal functions, pure utilities, indicator calculations

## What to Test

- **Indicators**: pure math, test with known market data
- **Risk rules**: all constraints verified with edge cases
- **Agent routing**: correct model selection per scenario
- **API auth**: reject unauthenticated requests

## Best Practices

- Use `should` in test names
- Each test independent — no shared mutable state
- Test edge cases: empty portfolios, zero cash, market closed
