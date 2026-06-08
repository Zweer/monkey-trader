import { describe, expect, it } from 'vitest';

import { parseDecision } from './validate';

const VALID_JSON = JSON.stringify({
  action: 'buy',
  ticker: 'AAPL',
  sizePercent: 5,
  confidence: 0.7,
  reasoning: 'RSI oversold, strong support at MA50.',
  stopLossPercent: -8,
  targetPercent: 12,
  timeHorizon: '3-5 days',
});

describe('parseDecision', () => {
  it('should parse valid JSON', () => {
    const result = parseDecision(VALID_JSON);
    expect(result).not.toBeNull();
    expect(result!.action).toBe('buy');
    expect(result!.ticker).toBe('AAPL');
    expect(result!.sizePercent).toBe(5);
    expect(result!.confidence).toBe(0.7);
  });

  it('should strip markdown fences', () => {
    const wrapped = `\`\`\`json\n${VALID_JSON}\n\`\`\``;
    const result = parseDecision(wrapped);
    expect(result).not.toBeNull();
    expect(result!.action).toBe('buy');
  });

  it('should reject invalid action', () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), action: 'yolo' });
    expect(parseDecision(json)).toBeNull();
  });

  it('should reject sizePercent > 20', () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), sizePercent: 25 });
    expect(parseDecision(json)).toBeNull();
  });

  it('should reject negative sizePercent', () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), sizePercent: -1 });
    expect(parseDecision(json)).toBeNull();
  });

  it('should reject confidence > 1', () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), confidence: 1.5 });
    expect(parseDecision(json)).toBeNull();
  });

  it('should reject missing reasoning', () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), reasoning: '' });
    expect(parseDecision(json)).toBeNull();
  });

  it('should return null for malformed JSON', () => {
    expect(parseDecision('not json at all')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseDecision('')).toBeNull();
  });

  it('should accept hold with sizePercent 0', () => {
    const json = JSON.stringify({ ...JSON.parse(VALID_JSON), action: 'hold', sizePercent: 0 });
    const result = parseDecision(json);
    expect(result).not.toBeNull();
    expect(result!.action).toBe('hold');
  });
});
