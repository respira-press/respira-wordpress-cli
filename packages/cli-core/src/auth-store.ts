import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const SERVICE_NAME = 'respira-cli';
const ACCOUNT_NAME = 'default';
const FALLBACK_FILE = join(homedir(), '.respira', 'credentials');

/**
 * OS-keyring backed credential store.
 *
 * Uses @napi-rs/keyring (actively maintained NAPI-RS project) instead of
 * the now-unmaintained `keytar`, whose `prebuild-install` dependency
 * triggers npm deprecation warnings on every install. Falls back to a
 * 0o600-permissioned file at ~/.respira/credentials when the OS keyring
 * is unavailable (CI, headless boxes, Linux without secret-service).
 */
type KeyringModule = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

async function loadKeytar(): Promise<KeyringModule | null> {
  try {
    const mod = await import('@napi-rs/keyring');
    const Entry = (mod as any).Entry ?? (mod as any).default?.Entry;
    if (!Entry) return null;
    return {
      async getPassword(service, account) {
        try {
          const entry = new Entry(service, account);
          return entry.getPassword();
        } catch {
          return null;
        }
      },
      async setPassword(service, account, password) {
        const entry = new Entry(service, account);
        entry.setPassword(password);
      },
      async deletePassword(service, account) {
        try {
          const entry = new Entry(service, account);
          return entry.deletePassword();
        } catch {
          return false;
        }
      },
    };
  } catch {
    return null;
  }
}

async function writeFileFallback(token: string): Promise<void> {
  await fs.mkdir(dirname(FALLBACK_FILE), { recursive: true, mode: 0o700 });
  await fs.writeFile(FALLBACK_FILE, token, { mode: 0o600 });
}

async function readFileFallback(): Promise<string | null> {
  try {
    const raw = await fs.readFile(FALLBACK_FILE, 'utf8');
    return raw.trim() || null;
  } catch {
    return null;
  }
}

async function deleteFileFallback(): Promise<void> {
  try {
    await fs.unlink(FALLBACK_FILE);
  } catch {
    // ignore
  }
}

export interface AuthStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export async function createAuthStore(): Promise<AuthStore> {
  const keytar = await loadKeytar();
  return {
    async get() {
      const envToken = process.env.RESPIRA_API_KEY;
      if (envToken) return envToken;
      if (keytar) {
        const stored = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (stored) return stored;
      }
      return readFileFallback();
    },
    async set(token: string) {
      if (keytar) {
        await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
        return;
      }
      await writeFileFallback(token);
    },
    async clear() {
      if (keytar) {
        await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME).catch(() => false);
      }
      await deleteFileFallback();
    },
  };
}
