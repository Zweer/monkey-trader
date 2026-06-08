import { callGemini } from './gemini';
import { buildTickPrompt, SYSTEM_PROMPT } from './prompts';
import { selectModel } from './router';
import type { AgentDecision, TickContext } from './types';
import { parseDecision } from './validate';

const HOLD_FALLBACK: AgentDecision = {
  action: 'hold',
  ticker: '',
  sizePercent: 0,
  confidence: 0,
  reasoning: 'LLM response invalid — defaulting to hold',
  stopLossPercent: 0,
  targetPercent: 0,
  timeHorizon: 'N/A',
};

const ANTI_FLIP_FLOP_MS = 2 * 60 * 60 * 1000; // 2 hours

export async function getDecision(context: TickContext): Promise<AgentDecision> {
  // Anti-flip-flop: skip if last decision on this ticker was < 2h ago
  const lastDecision = context.recentDecisions[0];
  if (lastDecision) {
    const elapsed = Date.now() - lastDecision.timestamp.getTime();
    if (elapsed < ANTI_FLIP_FLOP_MS) {
      return {
        ...HOLD_FALLBACK,
        ticker: context.ticker,
        reasoning: `Last decision was ${Math.round(elapsed / 60000)}min ago — skipping to avoid flip-flop`,
      };
    }
  }

  const model = selectModel(context);
  const prompt = buildTickPrompt(context);

  // Attempt 1
  let decision = await attemptCall(model, prompt);
  if (decision) return applyGates(decision, context);

  // Retry once
  console.warn(`[agent] First attempt invalid for ${context.ticker}, retrying...`);
  decision = await attemptCall(model, prompt);
  if (decision) return applyGates(decision, context);

  // Fallback
  console.error(`[agent] Both attempts failed for ${context.ticker}, falling back to hold`);
  return { ...HOLD_FALLBACK, ticker: context.ticker };
}

async function attemptCall(model: 'flash' | 'pro', prompt: string): Promise<AgentDecision | null> {
  try {
    const { text, inputTokens, outputTokens } = await callGemini(model, prompt, SYSTEM_PROMPT);
    console.log(`[agent] ${model} used ${inputTokens}+${outputTokens} tokens`);
    return parseDecision(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[agent] Gemini call failed: ${msg}`);
    return null;
  }
}

function applyGates(decision: AgentDecision, context: TickContext): AgentDecision {
  // Confidence gate: if < 0.5, override to hold
  if (decision.confidence < 0.5 && decision.action !== 'hold') {
    return {
      ...decision,
      action: 'hold',
      sizePercent: 0,
      reasoning: `${decision.reasoning} [Overridden: confidence ${decision.confidence} < 0.5 threshold]`,
    };
  }
  return decision;
}

export type { AgentDecision, TickContext } from './types';
