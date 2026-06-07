import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDbWithMigrations } from '@/db';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  let dbStatus: 'connected' | 'error' = 'error';

  try {
    const db = await getDbWithMigrations();
    await db.execute(sql`SELECT 1`);
    dbStatus = 'connected';
  } catch {
    // DB unreachable — report but don't crash
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
}
