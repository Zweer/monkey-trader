import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getDbWithMigrations } from './index';
import { watchlist } from './schema';

describe('db with PGlite', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should run migrations and insert/select from watchlist', async () => {
    const db = await getDbWithMigrations();

    await db.insert(watchlist).values({
      ticker: 'AAPL',
      name: 'Apple Inc.',
      type: 'stock',
      sector: 'Technology',
    });

    const rows = await db.select().from(watchlist).where(eq(watchlist.ticker, 'AAPL'));

    expect(rows).toHaveLength(1);
    expect(rows[0].ticker).toBe('AAPL');
    expect(rows[0].name).toBe('Apple Inc.');
    expect(rows[0].type).toBe('stock');
    expect(rows[0].active).toBe(true);
  });
});
