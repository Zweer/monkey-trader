import { GoogleGenerativeAI } from '@google/generative-ai';

export type GeminiModel = 'flash' | 'pro';

const MODEL_MAP: Record<GeminiModel, string> = {
  flash: 'gemini-2.5-flash',
  pro: 'gemini-2.5-pro',
};

const TIMEOUT_MS = 30_000;

function getClient(): GoogleGenerativeAI {
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
}

export async function callGemini(
  model: GeminiModel,
  prompt: string,
  systemPrompt: string,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const client = getClient();
  const genModel = client.getGenerativeModel({
    model: MODEL_MAP[model],
    systemInstruction: systemPrompt,
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const result = await genModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata;

    return {
      text,
      inputTokens: usage?.promptTokenCount ?? 0,
      outputTokens: usage?.candidatesTokenCount ?? 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}
