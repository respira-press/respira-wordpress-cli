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

  it('calls GET /cli/sites and parses the response', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify([{ id: 's1', url: 'https://a.test', name: 'A' }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const client = createRespiraClient({ apiKey: 'test-key', anonymous: true });
    const sites = await client.sites.list();
    expect(sites).toHaveLength(1);
    expect(sites[0]!.url).toBe('https://a.test');
    const call = fetchSpy.mock.calls[0]!;
    expect(String(call[0])).toContain('/cli/sites');
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
});
