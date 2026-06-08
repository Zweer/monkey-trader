import type { AgentDecision } from './types';

const VALID_ACTIONS = new Set(['buy', 'sell', 'hold']);

export function parseDecision(raw: string): AgentDecision | null {
  try {
    // Strip markdown fences if present
    const cleaned = raw
      .replace(/^```(?:json)?\s*\n?/m, '')
      .replace(/\n?```\s*$/m, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    if (!VALID_ACTIONS.has(parsed.action)) return null;
    if (typeof parsed.ticker !== 'string' || parsed.ticker.length === 0) return null;
    if (typeof parsed.sizePercent !== 'number' || parsed.sizePercent < 0 || parsed.sizePercent > 20)
      return null;
    if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 1)
      return null;
    if (typeof parsed.reasoning !== 'string' || parsed.reasoning.length === 0) return null;
    if (typeof parsed.stopLossPercent !== 'number') return null;
    if (typeof parsed.targetPercent !== 'number') return null;
    if (typeof parsed.timeHorizon !== 'string') return null;

    return {
      action: parsed.action,
      ticker: parsed.ticker,
      sizePercent: parsed.sizePercent,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      stopLossPercent: parsed.stopLossPercent,
      targetPercent: parsed.targetPercent,
      timeHorizon: parsed.timeHorizon,
    };
  } catch {
    return null;
  }
}
