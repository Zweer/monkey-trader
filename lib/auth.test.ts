import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyTickSecret } from './auth';

describe('verifyTickSecret', () => {
  beforeEach(() => {
    vi.stubEnv('TICK_SECRET', 'test-secret-123');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should return true for valid bearer token', () => {
    const req = new Request('http://localhost', {
      headers: { authorization: 'Bearer test-secret-123' },
    });
    expect(verifyTickSecret(req)).toBe(true);
  });

  it('should return false for invalid token', () => {
    const req = new Request('http://localhost', {
      headers: { authorization: 'Bearer wrong-token' },
    });
    expect(verifyTickSecret(req)).toBe(false);
  });

  it('should return false for missing header', () => {
    const req = new Request('http://localhost');
    expect(verifyTickSecret(req)).toBe(false);
  });

  it('should return false for non-bearer scheme', () => {
    const req = new Request('http://localhost', {
      headers: { authorization: 'Basic test-secret-123' },
    });
    expect(verifyTickSecret(req)).toBe(false);
  });
});
