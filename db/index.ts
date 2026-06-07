import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import * as schema from './schema';

export type Db =
  | ReturnType<typeof drizzleNeon<typeof schema>>
  | ReturnType<typeof drizzlePglite<typeof schema>>;

let _db: Db | undefined;
let _migrated = false;

function createNeonDb(): Db {
  return drizzleNeon(process.env.DATABASE_URL!, { schema });
}

function createPgliteDb(): ReturnType<typeof drizzlePglite<typeof schema>> {
  const client = new PGlite();
  return drizzlePglite({ client, schema });
}

export function getDb(): Db {
  if (!_db) {
    _db = process.env.DATABASE_URL ? createNeonDb() : createPgliteDb();
  }
  return _db;
}

export async function getDbWithMigrations(): Promise<Db> {
  const database = getDb();

  if (!process.env.DATABASE_URL && !_migrated) {
    await migrate(database as ReturnType<typeof drizzlePglite>, {
      migrationsFolder: './db/migrations',
    });
    _migrated = true;
  }

  return database;
}
