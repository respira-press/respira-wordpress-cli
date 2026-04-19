import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createAuthStore } from '../src/auth-store.js';

describe('auth-store env precedence', () => {
  const originalEnv = process.env.RESPIRA_API_KEY;

  beforeEach(() => {
    delete process.env.RESPIRA_API_KEY;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.RESPIRA_API_KEY;
    } else {
      process.env.RESPIRA_API_KEY = originalEnv;
    }
  });

  it('returns RESPIRA_API_KEY when set', async () => {
    process.env.RESPIRA_API_KEY = 'env-key';
    const store = await createAuthStore();
    expect(await store.get()).toBe('env-key');
  });
});
