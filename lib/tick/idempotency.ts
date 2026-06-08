export type TickResult = {
  tickId: string;
  timestamp: string;
  processed: number;
  signalsStrong: number;
  decisionsGenerated: number;
  tradesExecuted: number;
  autoTriggers: number;
  durationMs: number;
  warnings?: string[];
};

const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

let lastTick: { result: TickResult; completedAt: number } | null = null;

export function checkRecentTick(): TickResult | null {
  if (!lastTick) return null;
  if (Date.now() - lastTick.completedAt > DEDUP_WINDOW_MS) return null;
  return lastTick.result;
}

export function saveTickResult(result: TickResult): void {
  lastTick = { result, completedAt: Date.now() };
}

/** Reset for testing */
export function resetTickCache(): void {
  lastTick = null;
}
