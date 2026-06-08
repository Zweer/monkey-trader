import { eq } from 'drizzle-orm';

import { getDb } from '@/db';
import { watchlist } from '@/db/schema';
import { callGemini } from '@/lib/agent/gemini';

import type { QuickScanResult } from './quick-scan';
import { quickScan } from './quick-scan';
import { getFullUniverse } from './universe';

export type ScreeningSelection = { ticker: string; reason: string };

export type ScreeningResult = {
  selected: ScreeningSelection[];
  dropped: ScreeningSelection[];
  summary: string;
};

const SYSTEM_PROMPT = `You are MonkeyTrader's screening agent. You analyze a universe of stocks and crypto to select the 10-30 most interesting titles for active monitoring over the next 24 hours. You MUST respond with valid JSON only.`;

export function buildScreeningPrompt(
  candidates: QuickScanResult[],
  currentWatchlist: string[],
  heldPositions: string[],
): string {
  const topMovers = [...candidates]
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h))
    .slice(0, 20);
  const lines = topMovers.map(
    (c) =>
      `${c.ticker} | ${c.name} | ${c.sector} | $${c.price.toFixed(2)} | ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(1)}% | RSI:${c.rsi14?.toFixed(0) ?? 'N/A'} | MA50:${c.aboveMa50 ?? 'N/A'}`,
  );

  return `UNIVERSE (top movers from ${candidates.length} candidates):
${lines.join('\n')}

CURRENT WATCHLIST: ${currentWatchlist.join(', ') || 'empty'}
HELD POSITIONS (CANNOT be dropped): ${heldPositions.join(', ') || 'none'}

Select 10-30 titles. Include ALL held positions. Prefer: extreme RSI, high volume movers, clear trends.

RESPOND WITH THIS JSON:
{
  "selected": [{ "ticker": "...", "reason": "..." }],
  "dropped": [{ "ticker": "...", "reason": "..." }],
  "summary": "2-3 sentences on market outlook"
}`;
}

export function parseScreeningResult(raw: string, heldPositions: string[]): ScreeningResult | null {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/m, '')
      .replace(/\n?```\s*$/m, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed.selected) || parsed.selected.length === 0) return null;
    if (typeof parsed.summary !== 'string') return null;

    // Ensure held positions are included
    for (const ticker of heldPositions) {
      if (!parsed.selected.some((s: ScreeningSelection) => s.ticker === ticker)) {
        parsed.selected.push({ ticker, reason: 'Held position — must stay on watchlist' });
      }
    }

    return {
      selected: parsed.selected,
      dropped: parsed.dropped ?? [],
      summary: parsed.summary,
    };
  } catch {
    return null;
  }
}

export async function runScreening(): Promise<ScreeningResult> {
  const db = getDb();

  // 1. Get universe and scan
  const universe = await getFullUniverse();
  const scanned = await quickScan(universe);

  // 2. Get current state
  const watchlistRows = await db.select().from(watchlist).where(eq(watchlist.active, true));
  const currentWatchlist = watchlistRows.map((r) => r.ticker);
  const heldPositions: string[] = []; // TODO: query portfolio table

  // 3. Build prompt and call Gemini Pro
  const prompt = buildScreeningPrompt(scanned, currentWatchlist, heldPositions);
  const { text } = await callGemini('pro', prompt, SYSTEM_PROMPT);

  // 4. Parse and validate
  let result = parseScreeningResult(text, heldPositions);
  if (!result) {
    // Retry once
    const { text: retry } = await callGemini('pro', prompt, SYSTEM_PROMPT);
    result = parseScreeningResult(retry, heldPositions);
  }

  if (!result) {
    return { selected: [], dropped: [], summary: 'Screening failed — no changes made' };
  }

  // 5. Update watchlist
  const selectedTickers = new Set(result.selected.map((s) => s.ticker));

  for (const sel of result.selected) {
    const existing = watchlistRows.find((r) => r.ticker === sel.ticker);
    if (!existing) {
      const candidate = universe.find((u) => u.symbol === sel.ticker);
      if (candidate) {
        await db.insert(watchlist).values({
          ticker: candidate.symbol,
          name: candidate.name,
          type: candidate.type,
          sector: candidate.sector,
        });
      }
    } else if (!existing.active) {
      await db.update(watchlist).set({ active: true }).where(eq(watchlist.ticker, sel.ticker));
    }
  }

  // Deactivate dropped
  for (const row of watchlistRows) {
    if (!selectedTickers.has(row.ticker) && !heldPositions.includes(row.ticker)) {
      await db.update(watchlist).set({ active: false }).where(eq(watchlist.ticker, row.ticker));
    }
  }

  return result;
}
