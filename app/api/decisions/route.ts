import { and, desc, eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { decisions } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 20)));
  const ticker = url.searchParams.get('ticker') ?? undefined;
  const action = url.searchParams.get('action') ?? undefined;

  const db = getDb();
  const offset = (page - 1) * limit;

  const conditions = [];
  if (ticker) conditions.push(eq(decisions.ticker, ticker));
  if (action && ['buy', 'sell', 'hold'].includes(action)) {
    conditions.push(eq(decisions.action, action as 'buy' | 'sell' | 'hold'));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(decisions)
    .where(where)
    .orderBy(desc(decisions.timestamp))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(decisions)
    .where(where);

  const total = Number(countResult[0]?.count ?? 0);

  return NextResponse.json({
    decisions: rows.map((d) => ({
      id: d.id,
      ticker: d.ticker,
      timestamp: d.timestamp.toISOString(),
      action: d.action,
      sizePercent: Number(d.sizePercent),
      confidence: Number(d.confidence),
      reasoning: d.reasoning,
      modelUsed: d.modelUsed,
      priceAtDecision: Number(d.priceAtDecision),
      executed: d.executed,
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
