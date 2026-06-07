import { NextResponse } from 'next/server';

import { verifyTickSecret } from '@/lib/auth';

export async function POST(request: Request): Promise<NextResponse> {
  if (!verifyTickSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ status: 'ok', message: 'screen stub' });
}
