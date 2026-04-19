import { describe, it, expect } from 'vitest';
import { SiteSchema, PageSchema, AuthStatusSchema } from '../src/types/index.js';

describe('zod schemas', () => {
  it('SiteSchema accepts a minimal site', () => {
    const site = SiteSchema.parse({
      id: 's_1',
      url: 'https://example.com',
      name: 'example',
    });
    expect(site.builder).toBe('unknown');
    expect(site.status).toBe('connected');
  });

  it('SiteSchema rejects invalid url', () => {
    expect(() =>
      SiteSchema.parse({ id: 's_1', url: 'not-a-url', name: 'x' }),
    ).toThrow();
  });

  it('PageSchema requires url', () => {
    expect(() =>
      PageSchema.parse({ id: 'p_1', title: 'Home', slug: 'home', builder: 'elementor', status: 'published' }),
    ).toThrow();
  });

  it('AuthStatusSchema defaults tier to anonymous', () => {
    const status = AuthStatusSchema.parse({ authenticated: false });
    expect(status.tier).toBe('anonymous');
  });
});
