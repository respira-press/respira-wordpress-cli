import {
  ApiClient,
  type ApiClientOptions,
  createAuthStore,
  createSitesStore,
  type SiteContext,
  type SitesStore,
  type StoredSite,
} from '@respira/cli-core';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';
import { z } from 'zod';
import {
  AuthStatusSchema,
  CreatePageInputSchema,
  CreatePostInputSchema,
  DesignSystemInputSchema,
  DesignSystemSchema,
  DiviModuleSchema,
  DocSchema,
  ElementSchema,
  ElementorComponentSchema,
  FindElementQuerySchema,
  FoundElementSchema,
  HealthReportSchema,
  MediaFilterSchema,
  MediaSchema,
  PageSchema,
  PagesFilterSchema,
  PatchSchema,
  PostSchema,
  PostsFilterSchema,
  ReadOptsSchema,
  SiteFilterSchema,
  SiteSchema,
  SiteStructureSchema,
  SnapshotSchema,
  TermSchema,
  ToolFilterSchema,
  ToolSchema,
  UserSchema,
  type AuthStatus,
  type CreatePageInput,
  type CreatePostInput,
  type DesignSystem,
  type DesignSystemInput,
  type DiviModule,
  type Doc,
  type Element,
  type ElementorComponent,
  type FindElementQuery,
  type FoundElement,
  type HealthReport,
  type Media,
  type MediaFilter,
  type Page,
  type PagesFilter,
  type Patch,
  type Post,
  type PostsFilter,
  type ReadOpts,
  type Site,
  type SiteFilter,
  type SiteStructure,
  type Snapshot,
  type Term,
  type Tool,
  type ToolFilter,
  type User,
} from './types/index.js';

export interface RespiraClientOptions extends ApiClientOptions {
  /** Skip reading credentials from keychain / env when no explicit apiKey is provided. */
  anonymous?: boolean;
}

export function createRespiraClient(opts: RespiraClientOptions = {}): RespiraClient {
  let cachedKey: string | null | undefined;
  const resolver = opts.anonymous
    ? async () => null
    : async () => {
        if (cachedKey !== undefined) return cachedKey;
        if (opts.apiKey) {
          cachedKey = opts.apiKey;
          return cachedKey;
        }
        const store = await createAuthStore();
        cachedKey = await store.get();
        return cachedKey;
      };

  let sitesStorePromise: Promise<SitesStore> | null = null;
  function getSitesStore(): Promise<SitesStore> {
    if (!sitesStorePromise) sitesStorePromise = createSitesStore();
    return sitesStorePromise;
  }

  const siteResolver = async (siteId: string): Promise<SiteContext | null> => {
    // Caller-provided resolver wins. Useful for scripts that pass site keys explicitly.
    if (opts.siteResolver) {
      const ctx = await opts.siteResolver(siteId);
      if (ctx) return ctx;
    }
    const store = await getSitesStore();
    const entry = await store.find(siteId);
    if (!entry) return null;
    return { url: entry.url, apiKey: entry.apiKey };
  };

  const api = new ApiClient({
    ...opts,
    apiKey: null,
    apiKeyResolver: resolver,
    siteResolver,
  });

  function get<T>(path: string, query?: Record<string, string | number | boolean | undefined>, site?: string): Promise<T> {
    return api.request<T>(path, { method: 'GET', query, site });
  }
  function post<T>(path: string, body?: unknown, query?: Record<string, string | number | boolean | undefined>, site?: string): Promise<T> {
    return api.request<T>(path, {
      method: 'POST',
      body: body != null ? JSON.stringify(body) : undefined,
      query,
      site,
    });
  }

  function toPublicSite(entry: StoredSite): Site {
    return SiteSchema.parse({
      id: entry.name,
      url: entry.url,
      name: entry.name,
      builder: 'unknown',
      status: 'connected',
      lastCheckedAt: entry.addedAt,
    });
  }

  return {
    auth: {
      async whoami(): Promise<User> {
        return UserSchema.parse(await get('cli/auth/whoami'));
      },
      async status(): Promise<AuthStatus> {
        return AuthStatusSchema.parse(await get('cli/auth/status'));
      },
    },
    sites: {
      /**
       * List sites connected through this CLI instance.
       * Reads from ~/.respira/sites.json — no network call.
       */
      async list(filter?: SiteFilter): Promise<Site[]> {
        if (filter) SiteFilterSchema.parse(filter);
        const store = await getSitesStore();
        const entries = await store.list();
        let items = entries.map(toPublicSite);
        if (filter?.search) {
          const q = filter.search.toLowerCase();
          items = items.filter(
            (s) => s.url.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
          );
        }
        return items;
      },
      /**
       * Read site info from the local store. For live site context (WP version,
       * active builder), call sites.health(site) — that's the live probe.
       */
      async info(site: string): Promise<Site> {
        const store = await getSitesStore();
        const entry = await store.find(site);
        if (!entry) {
          throw new Error(`site "${site}" is not configured locally. Run: respira sites connect <url> --key=respira_...`);
        }
        return toPublicSite(entry);
      },
      /**
       * Hit the live WP plugin via the backend proxy to verify reachability.
       */
      async health(site: string): Promise<HealthReport> {
        const store = await getSitesStore();
        const entry = await store.find(site);
        if (!entry) {
          throw new Error(`site "${site}" is not configured locally. Run: respira sites connect <url> --key=respira_...`);
        }
        return HealthReportSchema.parse(
          await post(`cli/sites/${encodeURIComponent(entry.url)}/health`, undefined, undefined, entry.url),
        );
      },
      /**
       * Store a site's plugin API key in ~/.respira/sites.json. The key the WP
       * plugin generates (respira_...) is kept locally. No upload. The CLI
       * injects it on every site-scoped request via the X-Respira-Site-Key
       * header.
       */
      async connect(input: { url: string; apiKey: string; name?: string }): Promise<Site> {
        const store = await getSitesStore();
        const entry = await store.add(input);
        return toPublicSite(entry);
      },
      /**
       * Remove a site from ~/.respira/sites.json. The WP plugin still considers
       * the key active — revoke there if you want to kill the connection
       * entirely.
       */
      async disconnect(idOrUrl: string): Promise<boolean> {
        const store = await getSitesStore();
        return store.remove(idOrUrl);
      },
    },
    read: {
      async page(site: string, page: string, opts?: ReadOpts): Promise<Page> {
        const parsed = opts ? ReadOptsSchema.parse(opts) : { as: 'builder' as const };
        return PageSchema.parse(
          await get(`cli/sites/${encodeURIComponent(site)}/pages/${encodeURIComponent(page)}`, { as: parsed.as }, site),
        );
      },
      async pages(site: string, filter?: PagesFilter): Promise<Page[]> {
        const parsed = filter ? PagesFilterSchema.parse(filter) : undefined;
        return z.array(PageSchema).parse(await get(`cli/sites/${encodeURIComponent(site)}/pages`, parsed, site));
      },
      async post(site: string, post: string): Promise<Post> {
        return PostSchema.parse(
          await get(`cli/sites/${encodeURIComponent(site)}/posts/${encodeURIComponent(post)}`, undefined, site),
        );
      },
      async posts(site: string, filter?: PostsFilter): Promise<Post[]> {
        const parsed = filter ? PostsFilterSchema.parse(filter) : undefined;
        return z.array(PostSchema).parse(await get(`cli/sites/${encodeURIComponent(site)}/posts`, parsed, site));
      },
      async media(site: string, filter?: MediaFilter): Promise<Media[]> {
        const parsed = filter ? MediaFilterSchema.parse(filter) : undefined;
        return z.array(MediaSchema).parse(await get(`cli/sites/${encodeURIComponent(site)}/media`, parsed, site));
      },
      async taxonomy(site: string, taxonomy: string): Promise<Term[]> {
        return z
          .array(TermSchema)
          .parse(await get(`cli/sites/${encodeURIComponent(site)}/taxonomies/${encodeURIComponent(taxonomy)}`, undefined, site));
      },
      async structure(site: string): Promise<SiteStructure> {
        // Anonymous endpoint — no site headers needed (site URL is the query param).
        return SiteStructureSchema.parse(await get('cli/public/structure', { site }));
      },
      async designSystem(site: string): Promise<DesignSystem> {
        return DesignSystemSchema.parse(await get('cli/public/design-system', { site }));
      },
      async elementorFooter(site: string): Promise<ElementorComponent> {
        return ElementorComponentSchema.parse(
          await get(`cli/sites/${encodeURIComponent(site)}/elementor/footer`, undefined, site),
        );
      },
      async diviModule(site: string, moduleId: string): Promise<DiviModule> {
        return DiviModuleSchema.parse(
          await get(`cli/sites/${encodeURIComponent(site)}/divi/modules/${encodeURIComponent(moduleId)}`, undefined, site),
        );
      },
      async findElement(site: string, page: string, query: FindElementQuery): Promise<FoundElement[]> {
        const parsed = FindElementQuerySchema.parse(query);
        const data = await get<unknown>(
          `cli/sites/${encodeURIComponent(site)}/pages/${encodeURIComponent(page)}/find`,
          parsed,
          site,
        );
        return z.array(FoundElementSchema).parse(data);
      },
    },
    write: {
      async createPage(site: string, input: CreatePageInput): Promise<Page> {
        const parsed = CreatePageInputSchema.parse(input);
        return PageSchema.parse(await post(`cli/sites/${encodeURIComponent(site)}/pages`, parsed, undefined, site));
      },
      async editPage(site: string, page: string, patches: Patch[]): Promise<Page> {
        const parsed = z.array(PatchSchema).parse(patches);
        return PageSchema.parse(
          await post(`cli/sites/${encodeURIComponent(site)}/pages/${encodeURIComponent(page)}/patch`, { patches: parsed }, undefined, site),
        );
      },
      async editElement(
        site: string,
        page: string,
        selector: string,
        changes: Record<string, unknown>,
      ): Promise<Element> {
        return ElementSchema.parse(
          await post(`cli/sites/${encodeURIComponent(site)}/pages/${encodeURIComponent(page)}/element`, {
            selector,
            changes,
          }, undefined, site),
        );
      },
      async createPost(site: string, input: CreatePostInput): Promise<Post> {
        const parsed = CreatePostInputSchema.parse(input);
        return PostSchema.parse(await post(`cli/sites/${encodeURIComponent(site)}/posts`, parsed, undefined, site));
      },
      async updateDesignSystem(site: string, input: DesignSystemInput): Promise<DesignSystem> {
        const parsed = DesignSystemInputSchema.parse(input);
        return DesignSystemSchema.parse(
          await post(`cli/sites/${encodeURIComponent(site)}/design-system`, parsed, undefined, site),
        );
      },
      async uploadMedia(site: string, file: string | Buffer): Promise<Media> {
        const buffer = typeof file === 'string' ? await readFile(file) : file;
        const name = typeof file === 'string' ? basename(file) : 'upload.bin';
        const form = new FormData();
        form.set('file', new Blob([buffer]), name);
        const key = await resolver();
        const siteCtx = await siteResolver(site);
        const headers: Record<string, string> = {};
        if (key) headers['authorization'] = `Bearer ${key}`;
        if (siteCtx) {
          headers['x-respira-site-url'] = siteCtx.url;
          headers['x-respira-site-key'] = siteCtx.apiKey;
        }
        const res = await fetch(`${api.getBaseUrl()}/cli/sites/${encodeURIComponent(site)}/media`, {
          method: 'POST',
          headers,
          body: form,
        });
        if (!res.ok) throw new Error(`uploadMedia failed: HTTP ${res.status}`);
        return MediaSchema.parse(await res.json());
      },
      async deletePage(site: string, page: string, confirmOpts: { confirm: true }): Promise<void> {
        if (!confirmOpts.confirm) throw new Error('deletePage requires confirm: true');
        await api.request(`cli/sites/${encodeURIComponent(site)}/pages/${encodeURIComponent(page)}`, { method: 'DELETE' });
      },
    },
    tools: {
      async list(filter?: ToolFilter): Promise<Tool[]> {
        const parsed = filter ? ToolFilterSchema.parse(filter) : undefined;
        return z.array(ToolSchema).parse(await get('cli/tools', parsed));
      },
      async describe(name: string): Promise<Tool> {
        return ToolSchema.parse(await get(`cli/tools/${encodeURIComponent(name)}`));
      },
      async search(query: string): Promise<Tool[]> {
        return z.array(ToolSchema).parse(await get('cli/tools/search', { q: query }));
      },
    },
    docs: {
      async get(topic: string): Promise<Doc> {
        return DocSchema.parse(await get(`cli/docs/${encodeURIComponent(topic)}`));
      },
      async search(query: string): Promise<Doc[]> {
        return z.array(DocSchema).parse(await get('cli/docs/search', { q: query }));
      },
    },
    snapshots: {
      async list(site: string): Promise<Snapshot[]> {
        return z
          .array(SnapshotSchema)
          .parse(await get(`cli/sites/${encodeURIComponent(site)}/snapshots`, undefined, site));
      },
      async restore(snapshotId: string, site?: string): Promise<void> {
        await post(`cli/snapshots/${encodeURIComponent(snapshotId)}/restore`, undefined, undefined, site);
      },
      async show(snapshotId: string, site?: string): Promise<Snapshot> {
        return SnapshotSchema.parse(await get(`cli/snapshots/${encodeURIComponent(snapshotId)}`, undefined, site));
      },
    },
  };
}

export interface RespiraClient {
  auth: {
    whoami(): Promise<User>;
    status(): Promise<AuthStatus>;
  };
  sites: {
    list(filter?: SiteFilter): Promise<Site[]>;
    info(site: string): Promise<Site>;
    health(site: string): Promise<HealthReport>;
    connect(input: { url: string; apiKey: string; name?: string }): Promise<Site>;
    disconnect(idOrUrl: string): Promise<boolean>;
  };
  read: {
    page(site: string, page: string, opts?: ReadOpts): Promise<Page>;
    pages(site: string, filter?: PagesFilter): Promise<Page[]>;
    post(site: string, post: string): Promise<Post>;
    posts(site: string, filter?: PostsFilter): Promise<Post[]>;
    media(site: string, filter?: MediaFilter): Promise<Media[]>;
    taxonomy(site: string, taxonomy: string): Promise<Term[]>;
    structure(site: string): Promise<SiteStructure>;
    designSystem(site: string): Promise<DesignSystem>;
    elementorFooter(site: string): Promise<ElementorComponent>;
    diviModule(site: string, moduleId: string): Promise<DiviModule>;
    findElement(site: string, page: string, query: FindElementQuery): Promise<FoundElement[]>;
  };
  write: {
    createPage(site: string, input: CreatePageInput): Promise<Page>;
    editPage(site: string, page: string, patches: Patch[]): Promise<Page>;
    editElement(
      site: string,
      page: string,
      selector: string,
      changes: Record<string, unknown>,
    ): Promise<Element>;
    createPost(site: string, input: CreatePostInput): Promise<Post>;
    updateDesignSystem(site: string, input: DesignSystemInput): Promise<DesignSystem>;
    uploadMedia(site: string, file: string | Buffer): Promise<Media>;
    deletePage(site: string, page: string, opts: { confirm: true }): Promise<void>;
  };
  tools: {
    list(filter?: ToolFilter): Promise<Tool[]>;
    describe(name: string): Promise<Tool>;
    search(query: string): Promise<Tool[]>;
  };
  docs: {
    get(topic: string): Promise<Doc>;
    search(query: string): Promise<Doc[]>;
  };
  snapshots: {
    list(site: string): Promise<Snapshot[]>;
    restore(snapshotId: string, site?: string): Promise<void>;
    show(snapshotId: string, site?: string): Promise<Snapshot>;
  };
}
