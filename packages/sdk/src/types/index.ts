import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  workspace: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const AuthStatusSchema = z.object({
  authenticated: z.boolean(),
  user: UserSchema.optional(),
  tier: z.enum(['anonymous', 'lite', 'maker', 'studio', 'agency']).default('anonymous'),
  quota: z
    .object({
      limit: z.number().nullable(),
      used: z.number(),
      resetsAt: z.string().optional(),
    })
    .optional(),
});
export type AuthStatus = z.infer<typeof AuthStatusSchema>;

export const SiteSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  name: z.string(),
  builder: z
    .enum([
      'elementor',
      'divi',
      'bricks',
      'wpbakery',
      'beaver',
      'oxygen',
      'breakdance',
      'brizy',
      'thrive',
      'flatsome',
      'gutenberg',
      'unknown',
    ])
    .default('unknown'),
  wordpressVersion: z.string().optional(),
  theme: z.string().optional(),
  lastCheckedAt: z.string().optional(),
  status: z.enum(['connected', 'disconnected', 'error']).default('connected'),
});
export type Site = z.infer<typeof SiteSchema>;

export const SiteFilterSchema = z
  .object({
    builder: z.string().optional(),
    status: z.enum(['connected', 'disconnected', 'error']).optional(),
    search: z.string().optional(),
  })
  .partial();
export type SiteFilter = z.infer<typeof SiteFilterSchema>;

export const HealthReportSchema = z.object({
  site: z.string(),
  overall: z.enum(['ok', 'warn', 'fail']),
  checks: z.array(
    z.object({
      name: z.string(),
      status: z.enum(['ok', 'warn', 'fail']),
      message: z.string().optional(),
    }),
  ),
  checkedAt: z.string(),
});
export type HealthReport = z.infer<typeof HealthReportSchema>;

export const PageSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  url: z.string().url(),
  builder: z.string(),
  status: z.enum(['draft', 'published', 'private', 'pending']),
  content: z.unknown().optional(),
  updatedAt: z.string().optional(),
});
export type Page = z.infer<typeof PageSchema>;

export const ReadOptsSchema = z.object({
  as: z.enum(['builder', 'html', 'portable']).default('builder'),
});
export type ReadOpts = z.infer<typeof ReadOptsSchema>;

export const PagesFilterSchema = z
  .object({
    builder: z.string().optional(),
    status: z.string().optional(),
    limit: z.number().int().positive().max(500).optional(),
    search: z.string().optional(),
  })
  .partial();
export type PagesFilter = z.infer<typeof PagesFilterSchema>;

export const PostSchema = PageSchema.extend({
  type: z.string().default('post'),
  author: z.string().optional(),
});
export type Post = z.infer<typeof PostSchema>;

export const PostsFilterSchema = PagesFilterSchema.extend({
  type: z.string().optional(),
});
export type PostsFilter = z.infer<typeof PostsFilterSchema>;

export const MediaSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  filename: z.string(),
  mimeType: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
});
export type Media = z.infer<typeof MediaSchema>;

export const MediaFilterSchema = z
  .object({
    type: z.enum(['image', 'video', 'audio', 'document']).optional(),
    limit: z.number().int().positive().max(500).optional(),
  })
  .partial();
export type MediaFilter = z.infer<typeof MediaFilterSchema>;

export const TermSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.string(),
  count: z.number().optional(),
});
export type Term = z.infer<typeof TermSchema>;

export const SiteStructureSchema = z.object({
  site: z.string(),
  detectedBuilder: z.string(),
  pages: z.array(z.object({ url: z.string(), title: z.string().optional() })),
  sitemap: z.array(z.string()).optional(),
  signals: z.record(z.unknown()).optional(),
});
export type SiteStructure = z.infer<typeof SiteStructureSchema>;

export const DesignSystemSchema = z.object({
  site: z.string(),
  colors: z.array(z.object({ name: z.string(), value: z.string() })).default([]),
  fonts: z.array(z.object({ role: z.string(), family: z.string() })).default([]),
  spacing: z.record(z.string()).optional(),
  detectedBuilder: z.string().optional(),
});
export type DesignSystem = z.infer<typeof DesignSystemSchema>;

export const ElementorComponentSchema = z.object({
  site: z.string(),
  componentType: z.string(),
  content: z.unknown(),
});
export type ElementorComponent = z.infer<typeof ElementorComponentSchema>;

export const DiviModuleSchema = z.object({
  site: z.string(),
  moduleId: z.string(),
  shortcode: z.string(),
  attrs: z.record(z.unknown()),
});
export type DiviModule = z.infer<typeof DiviModuleSchema>;

export const CreatePageInputSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  status: z.enum(['draft', 'published', 'private']).default('draft'),
  template: z.string().optional(),
  content: z.unknown().optional(),
  builder: z.string().optional(),
});
export type CreatePageInput = z.infer<typeof CreatePageInputSchema>;

export const PatchSchema = z.object({
  op: z.enum(['set', 'unset', 'append', 'remove']),
  path: z.string(),
  value: z.unknown().optional(),
});
export type Patch = z.infer<typeof PatchSchema>;

export const ElementSchema = z.object({
  id: z.string(),
  type: z.string(),
  settings: z.record(z.unknown()),
});
export type Element = z.infer<typeof ElementSchema>;

export const FindElementQuerySchema = z
  .object({
    type: z.string().optional(),
    text: z.string().optional(),
    css: z.string().optional(),
    id: z.string().optional(),
    limit: z.number().int().positive().max(100).optional(),
  })
  .refine((q) => Boolean(q.type || q.text || q.css || q.id), {
    message: 'at least one of type, text, css, or id is required',
  });
export type FindElementQuery = z.infer<typeof FindElementQuerySchema>;

export const FoundElementSchema = z.object({
  id: z.string(),
  type: z.string(),
  text: z.string().optional(),
  path: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});
export type FoundElement = z.infer<typeof FoundElementSchema>;

export const DiffSchema = z.object({
  before: z.unknown(),
  after: z.unknown(),
  summary: z.string().optional(),
});
export type Diff = z.infer<typeof DiffSchema>;

export const CreatePostInputSchema = CreatePageInputSchema.extend({
  type: z.string().default('post'),
  markdown: z.string().optional(),
});
export type CreatePostInput = z.infer<typeof CreatePostInputSchema>;

export const DesignSystemInputSchema = z.object({
  colors: z.array(z.object({ name: z.string(), value: z.string() })).optional(),
  fonts: z.array(z.object({ role: z.string(), family: z.string() })).optional(),
  spacing: z.record(z.string()).optional(),
});
export type DesignSystemInput = z.infer<typeof DesignSystemInputSchema>;

export const ToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.string().optional(),
  builder: z.string().optional(),
  inputSchema: z.unknown().optional(),
});
export type Tool = z.infer<typeof ToolSchema>;

export const ToolFilterSchema = z
  .object({
    for: z.string().optional(),
    category: z.string().optional(),
    builder: z.string().optional(),
  })
  .partial();
export type ToolFilter = z.infer<typeof ToolFilterSchema>;

export const DocSchema = z.object({
  topic: z.string(),
  title: z.string(),
  content: z.string(),
  updatedAt: z.string().optional(),
});
export type Doc = z.infer<typeof DocSchema>;

export const SnapshotSchema = z.object({
  id: z.string(),
  site: z.string(),
  createdAt: z.string(),
  trigger: z.string().optional(),
  sizeBytes: z.number().optional(),
  description: z.string().optional(),
});
export type Snapshot = z.infer<typeof SnapshotSchema>;
