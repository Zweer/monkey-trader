import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGenerateText = vi.fn();

vi.mock('ai', () => ({
  generateText: (...args: unknown[]) => mockGenerateText(...args),
}));

vi.mock('@ai-sdk/google', () => ({
  google: vi.fn(() => 'mocked-model'),
}));

import { callGemini } from './gemini';

beforeEach(() => {
  vi.stubEnv('GOOGLE_GENERATIVE_AI_API_KEY', 'test-key');
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockGenerateText.mockReset();
});

describe('callGemini', () => {
  it('should return text and token usage on success', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '{"action":"hold"}',
      usage: { inputTokens: 100, outputTokens: 20 },
    });

    const result = await callGemini('flash', 'test prompt', 'system');

    expect(result.text).toBe('{"action":"hold"}');
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(20);
  });

  it('should propagate API errors', async () => {
    mockGenerateText.mockRejectedValueOnce(new Error('API rate limited'));

    await expect(callGemini('flash', 'test', 'system')).rejects.toThrow('API rate limited');
  });

  it('should pass correct params to generateText', async () => {
    mockGenerateText.mockResolvedValueOnce({
      text: '{}',
      usage: { inputTokens: 50, outputTokens: 10 },
    });

    await callGemini('pro', 'my prompt', 'my system');

    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'my system',
        prompt: 'my prompt',
      }),
    );
  });
});
