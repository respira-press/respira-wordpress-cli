import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const SERVICE_NAME = 'respira-cli';
const ACCOUNT_NAME = 'default';
const FALLBACK_FILE = join(homedir(), '.respira', 'credentials');

type KeytarModule = {
  getPassword(service: string, account: string): Promise<string | null>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<boolean>;
};

async function loadKeytar(): Promise<KeytarModule | null> {
  try {
    const mod = await import('keytar');
    return mod.default ?? (mod as unknown as KeytarModule);
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
