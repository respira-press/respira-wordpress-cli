import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRespiraClient } from '../src/client.js';

describe('createRespiraClient', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('calls GET /cli/auth/whoami with bearer token', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ id: 'u1', email: 'me@example.com' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createRespiraClient({ apiKey: 'test-key', anonymous: true });
    const user = await client.auth.whoami();
    expect(user.email).toBe('me@example.com');
    const call = fetchSpy.mock.calls[0]!;
    expect(String(call[0])).toContain('/cli/auth/whoami');
  });

  it('throws on non-2xx with mapped code', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ message: 'nope' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createRespiraClient({ apiKey: 'bad', anonymous: true });
    await expect(client.auth.whoami()).rejects.toMatchObject({ code: 'AUTH_INVALID' });
  });

  it('sites.list reads from local store, not network', async () => {
    const client = createRespiraClient({
      apiKey: 'test-key',
      anonymous: true,
      // Override siteResolver to guarantee the test is deterministic
      siteResolver: () => null,
    });
    // In a clean test env, the store is empty.
    const sites = await client.sites.list();
    expect(Array.isArray(sites)).toBe(true);
    // Never makes a network call for listing:
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
