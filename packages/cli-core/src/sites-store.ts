/**
 * Local store for per-site Respira plugin API keys.
 *
 * Lives at ~/.respira/sites.json. Plain JSON, mode 0600.
 *
 * Each site has:
 *   - name    short human label (required, unique)
 *   - url     canonical site URL (required, normalized)
 *   - apiKey  the plugin's `respira_...` key (required)
 *   - addedAt ISO timestamp
 *
 * Claude Code and other agents that speak HTTPS can also read this file to
 * discover which sites a user has configured.
 */

import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const STORE_DIR = join(homedir(), '.respira');
const STORE_PATH = join(STORE_DIR, 'sites.json');

export interface StoredSite {
  name: string;
  url: string;
  apiKey: string;
  addedAt: string;
}

interface StoreShape {
  version: 1;
  sites: StoredSite[];
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!u) throw new Error('site URL is required');
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  try {
    const parsed = new URL(u);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, '')}`.replace(/\/+$/, '');
  } catch {
    throw new Error(`invalid site URL: ${input}`);
  }
}

function normalizeName(input: string): string {
  return input.trim().replace(/[^a-z0-9._-]/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoreShape;
    if (parsed.version !== 1 || !Array.isArray(parsed.sites)) {
      return { version: 1, sites: [] };
    }
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return { version: 1, sites: [] };
    }
    throw err;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(dirname(STORE_PATH), { recursive: true, mode: 0o700 });
  const tmp = `${STORE_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2) + '\n', { mode: 0o600 });
  await fs.rename(tmp, STORE_PATH);
}

export interface SitesStore {
  list(): Promise<StoredSite[]>;
  find(idOrUrl: string): Promise<StoredSite | null>;
  add(input: { name?: string; url: string; apiKey: string }): Promise<StoredSite>;
  remove(idOrUrl: string): Promise<boolean>;
  path: string;
}

export async function createSitesStore(): Promise<SitesStore> {
  return {
    path: STORE_PATH,

    async list() {
      const store = await readStore();
      return store.sites.slice().sort((a, b) => a.name.localeCompare(b.name));
    },

    async find(idOrUrl: string) {
      if (!idOrUrl) return null;
      const store = await readStore();
      const needle = idOrUrl.trim().toLowerCase();
      const normalized = (() => {
        try {
          return normalizeUrl(idOrUrl).toLowerCase();
        } catch {
          return needle;
        }
      })();
      return (
        store.sites.find(
          (s) => s.name.toLowerCase() === needle || s.url.toLowerCase() === normalized,
        ) ?? null
      );
    },

    async add(input) {
      if (!input.apiKey) throw new Error('apiKey is required');
      if (!input.apiKey.startsWith('respira_')) {
        throw new Error("apiKey must start with 'respira_' (the plugin issues keys in this format)");
      }
      const url = normalizeUrl(input.url);
      let name = input.name ? normalizeName(input.name) : '';
      if (!name) {
        name = normalizeName(new URL(url).host) || 'site';
      }

      const store = await readStore();
      // Remove any existing entry with the same url or name (upsert).
      const filtered = store.sites.filter(
        (s) => s.url.toLowerCase() !== url.toLowerCase() && s.name !== name,
      );
      const entry: StoredSite = {
        name,
        url,
        apiKey: input.apiKey,
        addedAt: new Date().toISOString(),
      };
      filtered.push(entry);
      await writeStore({ version: 1, sites: filtered });
      return entry;
    },

    async remove(idOrUrl: string) {
      const store = await readStore();
      const before = store.sites.length;
      const needle = idOrUrl.trim().toLowerCase();
      const normalized = (() => {
        try {
          return normalizeUrl(idOrUrl).toLowerCase();
        } catch {
          return needle;
        }
      })();
      const filtered = store.sites.filter(
        (s) => s.name.toLowerCase() !== needle && s.url.toLowerCase() !== normalized,
      );
      if (filtered.length === before) return false;
      await writeStore({ version: 1, sites: filtered });
      return true;
    },
  };
}
