import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateContent = vi.fn();

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGenerateContent };
    }
  },
}));

import { callGemini } from './gemini';

beforeEach(() => {
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockGenerateContent.mockReset();
});

describe('callGemini', () => {
  it('should return text and token usage on success', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => '{"action":"hold"}',
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 20 },
      },
    });

    const result = await callGemini('flash', 'test prompt', 'system');

    expect(result.text).toBe('{"action":"hold"}');
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(20);
  });

  it('should handle missing usage metadata', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => '{"action":"buy"}',
        usageMetadata: undefined,
      },
    });

    const result = await callGemini('pro', 'test', 'system');

    expect(result.text).toBe('{"action":"buy"}');
    expect(result.inputTokens).toBe(0);
    expect(result.outputTokens).toBe(0);
  });

  it('should propagate API errors', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('API rate limited'));

    await expect(callGemini('flash', 'test', 'system')).rejects.toThrow('API rate limited');
  });
});
