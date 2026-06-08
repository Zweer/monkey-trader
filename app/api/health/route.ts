import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getDbWithMigrations } from '@/db';

export const dynamic = 'force-dynamic';

type ServiceStatus = 'ok' | 'error' | 'missing_key';

export async function GET(): Promise<NextResponse> {
  const [db, gemini, alpaca] = await Promise.all([checkDb(), checkGemini(), checkAlpaca()]);

  const allOk = db === 'ok' && gemini === 'ok' && alpaca === 'ok';

  return NextResponse.json({
    status: allOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    services: { db, gemini, alpaca },
  });
}

async function checkDb(): Promise<ServiceStatus> {
  try {
    const db = await getDbWithMigrations();
    await db.execute(sql`SELECT 1`);
    return 'ok';
  } catch {
    return 'error';
  }
}

async function checkGemini(): Promise<ServiceStatus> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return 'missing_key';
  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: 'Reply with exactly: ok',
      abortSignal: AbortSignal.timeout(10_000),
    });
    return text.toLowerCase().includes('ok') ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

async function checkAlpaca(): Promise<ServiceStatus> {
  if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_SECRET_KEY) return 'missing_key';
  try {
    const res = await fetch('https://paper-api.alpaca.markets/v2/account', {
      headers: {
        'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY,
      },
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}
