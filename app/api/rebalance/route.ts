import { NextResponse } from 'next/server';

import { verifyTickSecret } from '@/lib/auth';
import { runRebalance } from '@/lib/rebalance';

export async function POST(request: Request): Promise<NextResponse> {
  if (!verifyTickSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const start = Date.now();
    const result = await runRebalance();
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      model: 'pro',
      durationMs: Date.now() - start,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
