import { ErrorCodes, NetworkError, RespiraError } from './errors.js';

export interface SiteContext {
  url: string;
  apiKey: string;
}

export interface ApiClientOptions {
  baseUrl?: string;
  /** Static API key. Prefer apiKeyResolver for credential stores. */
  apiKey?: string | null;
  /** Resolver called on each request. Return null for anonymous. */
  apiKeyResolver?: () => Promise<string | null> | string | null;
  /**
   * Resolver called with the site identifier (URL or short name) a request is scoped to.
   * Return a { url, apiKey } object or null if unknown. The client injects
   * X-Respira-Site-Url + X-Respira-Site-Key headers when resolver succeeds.
   */
  siteResolver?: (siteId: string) => Promise<SiteContext | null> | SiteContext | null;
  userAgent?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface ApiRequestOptions extends Omit<RequestInit, 'headers'> {
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /**
   * Site identifier this request targets. Resolved through ApiClientOptions.siteResolver
   * into X-Respira-Site-Url + X-Respira-Site-Key headers.
   */
  site?: string;
}

const DEFAULT_BASE_URL = 'https://respira.press/api/v1';
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_MAX_RETRIES = 2;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | null;
  private readonly apiKeyResolver?: () => Promise<string | null> | string | null;
  private readonly siteResolver?: (siteId: string) => Promise<SiteContext | null> | SiteContext | null;
  private readonly userAgent: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(opts: ApiClientOptions = {}) {
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.apiKey = opts.apiKey ?? null;
    this.apiKeyResolver = opts.apiKeyResolver;
    this.siteResolver = opts.siteResolver;
    this.userAgent = opts.userAgent ?? 'respira-cli';
    this.timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async getApiKey(): Promise<string | null> {
    if (this.apiKey) return this.apiKey;
    if (this.apiKeyResolver) {
      return (await this.apiKeyResolver()) ?? null;
    }
    return null;
  }

  async request<T = unknown>(path: string, opts: ApiRequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, opts.query);
    const headers: Record<string, string> = { ...(opts.headers ?? {}) };
    headers['accept'] = 'application/json';
    headers['user-agent'] = this.userAgent;
    const key = await this.getApiKey();
    if (key) headers['authorization'] = `Bearer ${key}`;
    if (opts.body && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }
    if (opts.site && this.siteResolver) {
      const ctx = await this.siteResolver(opts.site);
      if (ctx) {
        headers['x-respira-site-url'] = ctx.url;
        headers['x-respira-site-key'] = ctx.apiKey;
      } else {
        throw new RespiraError(
          ErrorCodes.SITE_NOT_FOUND,
          `no local config for site "${opts.site}". Run: respira sites connect <url> --key=respira_...`,
          { status: 400, hint: 'respira sites connect <url> --key=respira_...' },
        );
      }
    }

    let lastErr: unknown;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      try {
        const res = await fetch(url, {
          ...opts,
          headers,
          signal: opts.signal ?? ctrl.signal,
        });
        clearTimeout(timer);
        if (res.status === 429 && attempt < this.maxRetries) {
          await sleep(backoffMs(attempt, res.headers.get('retry-after')));
          continue;
        }
        if (!res.ok) {
          throw await toRespiraError(res);
        }
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
          return (await res.json()) as T;
        }
        return (await res.text()) as unknown as T;
      } catch (err) {
        clearTimeout(timer);
        lastErr = err;
        if (err instanceof RespiraError) throw err;
        if (attempt < this.maxRetries) {
          await sleep(backoffMs(attempt));
          continue;
        }
        throw new NetworkError(`request failed: ${stringifyError(err)}`, err);
      }
    }
    throw new NetworkError(`request failed after ${this.maxRetries + 1} attempts`, lastErr);
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
    const joined = `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
    if (!query) return joined;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `${joined}?${qs}` : joined;
  }
}

async function toRespiraError(res: Response): Promise<RespiraError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // ignore
  }
  const message =
    (typeof body === 'object' && body !== null && 'message' in body && typeof (body as { message: unknown }).message === 'string'
      ? (body as { message: string }).message
      : null) ?? `HTTP ${res.status}`;
  const code = mapStatusToCode(res.status);
  return new RespiraError(code, message, { status: res.status, details: body as Record<string, unknown> });
}

function mapStatusToCode(status: number) {
  if (status === 401) return ErrorCodes.AUTH_INVALID;
  if (status === 402) return ErrorCodes.LICENSE_REQUIRED;
  if (status === 403) return ErrorCodes.LICENSE_REQUIRED;
  if (status === 404) return ErrorCodes.PAGE_NOT_FOUND;
  if (status === 429) return ErrorCodes.RATE_LIMITED;
  if (status >= 500) return ErrorCodes.SERVER_ERROR;
  return ErrorCodes.INVALID_INPUT;
}

function backoffMs(attempt: number, retryAfter?: string | null): number {
  if (retryAfter) {
    const parsed = Number(retryAfter);
    if (Number.isFinite(parsed)) return Math.max(0, parsed * 1000);
  }
  return Math.min(30_000, 500 * 2 ** attempt);
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function stringifyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
