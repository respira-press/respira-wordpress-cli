# @respira/sdk

<p align="center">
  <img src="https://respira.press/hero/cli-hero.jpg" alt="Respira SDK for WordPress" width="900" />
</p>

**The typed TypeScript client for WordPress, built for developers and AI agents.**

`@respira/sdk` powers [`@respira/cli`](https://www.npmjs.com/package/@respira/cli). Use it directly from scripts, CI jobs, and agent frameworks to read and write builder-native WordPress content. Every method is zod-validated. Dual ESM and CJS output.

[![npm version](https://img.shields.io/npm/v/@respira/sdk.svg)](https://www.npmjs.com/package/@respira/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@respira/sdk.svg)](https://nodejs.org/)

```bash
npm install @respira/sdk
```

## Quick start

```typescript
import { respira } from '@respira/sdk';

// credentials resolved from keychain, RESPIRA_API_KEY, or ~/.respira/credentials
const sites = await respira.sites.list();
const page = await respira.read.page('mysite.com', 'about');

await respira.write.editElement('mysite.com', 'about', 'heading-123', {
  title: 'welcome',
});
```

## Custom configuration

```typescript
import { createRespiraClient } from '@respira/sdk';

const client = createRespiraClient({
  apiKey: process.env.RESPIRA_API_KEY,
  baseUrl: 'https://respira.press/api/v1',
  timeoutMs: 30000,
});

const structure = await client.read.structure('mysite.com');
```

## Anonymous mode

Skip the keychain lookup and call public endpoints on any WordPress URL. No account required.

```typescript
import { createRespiraClient } from '@respira/sdk';

const client = createRespiraClient({ anonymous: true });

// detect page builders + sitemap on any public WordPress URL
const structure = await client.read.structure('https://example.com');

// extract colors + fonts from any public WordPress URL
const design = await client.read.designSystem('https://example.com');
```

## Seven namespaces

Every method is typed, zod-validated, and maps 1:1 to a `respira` CLI command.

- **`auth`**: login, logout, status, whoami
- **`sites`**: list, info, health, connect, disconnect
- **`read`**: page, pages, post, posts, media, taxonomy, structure, designSystem
- **`write`**: createPage, editPage, editElement, createPost, updateDesignSystem, uploadMedia, deletePage
- **`tools`**: list, describe, search
- **`docs`**: get builder documentation from the terminal or a script
- **`snapshots`**: list, show, restore

## Builder-native

The SDK understands Elementor, Divi (4 and 5), Bricks, WPBakery, Beaver Builder, Oxygen, Breakdance, Brizy, Thrive Architect, Flatsome UX Builder, native Gutenberg blocks, and WooCommerce. Responses preserve builder-native structure: you get Elementor widgets as Elementor widgets, Divi modules as Divi modules, Bricks elements as Bricks elements.

```typescript
// Elementor widget tree, not raw post_content
const page = await client.read.page('mysite.com', 'about');
//           ^? { slug, title, builder: 'elementor', tree: ElementorNode[] }

// Edit a module attribute on a Divi 5 page
await client.write.editElement('mysite.com', 'home', 'module-42', {
  text_font_size: '48px',
});
```

## Error handling

Every error is a `RespiraError` with a typed `code`, `status`, `hint`, and optional `details`.

```typescript
import { createRespiraClient, isRespiraError } from '@respira/sdk';

try {
  await client.write.deletePage('mysite.com', 'important-page');
} catch (err) {
  if (isRespiraError(err) && err.code === 'DRY_RUN') {
    // preview-only error; show diff and ask for confirmation
  }
}
```

Codes: `AUTH_REQUIRED`, `AUTH_INVALID`, `AUTH_EXPIRED`, `LICENSE_REQUIRED`, `QUOTA_EXCEEDED`, `RATE_LIMITED`, `SITE_NOT_FOUND`, `SITE_UNREACHABLE`, `PAGE_NOT_FOUND`, `BUILDER_UNSUPPORTED`, `INVALID_INPUT`, `NETWORK_ERROR`, `SERVER_ERROR`, `DRY_RUN`, `CANCELLED`.

## Safety

- Every destructive write (delete, restore, overwrite) requires explicit confirmation.
- Every connected-site write snapshots before mutation, so `respira snapshots restore` can roll back.
- `--dry-run` and `--diff` equivalents are available on every write method.

## Use it with AI agents

Drop the SDK into a Claude Code skill, a Cursor command, or a Codex job. It ships zod-validated types so coding agents can reason about the surface without guessing.

```typescript
import { createRespiraClient } from '@respira/sdk';

const client = createRespiraClient();

// the agent can safely chain these — every step is typed
const structure = await client.read.structure('mysite.com');
const pages = await client.read.pages('mysite.com');
for (const page of pages) {
  const tree = await client.read.page('mysite.com', page.slug);
  // ... analyze, edit, re-publish
}
```

## Companion packages

- [`@respira/cli`](https://www.npmjs.com/package/@respira/cli): the oclif CLI built on top of this SDK. 34 commands across 9 topics.
- [`@respira/cli-core`](https://www.npmjs.com/package/@respira/cli-core): shared primitives: execution cycle, hook contracts, tool chain function interface, trace emitter, error taxonomy, auth and site stores.

## Docs

- [SDK documentation](https://respira.press/cli/docs/sdk)
- [Architecture](https://respira.press/cli/docs/architecture)
- [Hooks](https://respira.press/cli/docs/hooks)
- [GitHub](https://github.com/respira-press/respira-wordpress-cli)

## License

MIT. Node.js 18 or later. Works on macOS, Linux, and Windows.

---

WordPress is a registered trademark of the WordPress Foundation. Respira is an independent open-source project and is not affiliated with, endorsed by, or sponsored by WordPress.org, Automattic, or the WordPress Foundation.
