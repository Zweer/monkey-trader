import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export type GeminiModel = 'flash' | 'pro';

const MODEL_MAP: Record<GeminiModel, string> = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
};

const TIMEOUT_MS = 30_000;

export async function callGemini(
  model: GeminiModel,
  prompt: string,
  systemPrompt: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const { text, usage } = await generateText({
    model: google(MODEL_MAP[model]),
    system: systemPrompt,
    prompt,
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  });

  return {
    text,
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
  };
}
