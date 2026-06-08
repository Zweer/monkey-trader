import { NextResponse } from 'next/server';

import { verifyTickSecret } from '@/lib/auth';
import { runTick } from '@/lib/tick';

export async function POST(request: Request): Promise<NextResponse> {
  if (!verifyTickSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runTick();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[TICK] fatal error:', message);
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
