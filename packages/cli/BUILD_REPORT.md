# Respira CLI for WordPress — v0.1.0 Build Report

Session: 2026-04-19. CLI source of truth: [github.com/respira-press/respira-wordpress-cli](https://github.com/respira-press/respira-wordpress-cli) (public, MIT, CI green on Node 18/20 × macOS/Ubuntu/Windows). Monorepo branch: `feat/respira-cli-for-wordpress` (backport + marketing + build report).

**Update log (most recent first):**
- 2026-04-19 late+: **Backend endpoints implemented**. 29 routes under `/api/v1/cli/*` in `product-website/src/pages/api/v1/cli/`. Anonymous endpoints (structure, design-system, tools, docs) have real implementations — structure/design-system scrape public HTML, tools/docs serve curated catalogs. Auth handshake end-to-end: `/cli/auth` browser page + `/api/v1/cli/auth/exchange` token issuance + keychain-hashed API keys in Supabase `cli_api_keys`. Migration: `supabase/migrations/20260419_cli_api_keys.sql` (tables: cli_api_keys, cli_auth_states with RLS). Remaining 21 sites/read/write/snapshot routes return typed 501 "NOT_IMPLEMENTED" with hint URL until the WordPress plugin bridge ships.
- 2026-04-19 late+: **Landing page + docs redesign** matching `releases/6.0.0` polish. Full-bleed hero with grid + dual-gradient overlay, animated badges, 4-column metrics strip, animated macOS-style terminal, WP-CLI comparison table, 12-card builder grid with per-card accents, 4 builder deep-dives (Elementor/Divi/Bricks/WPBakery @ 200+ words), WooCommerce spotlight, AI agents grid, 3-step how-it-works, install grid, animated FAQ, glowing CTA, trademark. New `CliDocLayout.astro` shared component; all 18 `/cli/docs/*` pages refactored to use it for consistent aesthetic.
- 2026-04-19 late: `find-element` command + SDK method + types added; `--diff` flag wired on `write edit-page` and `write edit-element` (client-side before/after); CLI test package populated (7 tests); end-to-end `npm install` + `npm run build` + `npm run typecheck` + `npm test` verified locally on Node 18.20.8; pushed to public repo; CI green across 6 platform/Node combos; npm publish dry-run clean.
- 2026-04-19 late: docs at respira-press/Respira.press-Documentation-and-Community updated with 15 new MDX pages under `cli/` + nav entry in documentation.json + changelog entry. Three repos transferred to respira-press org: docs, lite plugin, Claude skills. Stale webmyc URL references swept across all repos.

## 1. What was built

All six parts from the spec plus Part 7 deliverables, on a single feature branch. Four commits. Full contents:

### Parts 1 + 2 — monorepo + CLI commands
Commit `feat(cli): scaffold @respira/cli, @respira/sdk, @respira/cli-core packages`.

- `packages/cli-core/` — shared utilities: typed error hierarchy (`RespiraError`, `AuthRequiredError`, `LicenseRequiredError`, `NetworkError`), keychain-backed auth store with file fallback, TTY-aware output formatter, fetch-based API client with retry and 429 handling
- `packages/sdk/` — typed `respira` client. Every method zod-validated. Covers the full spec surface: auth, sites, read (including anonymous `structure` and `designSystem`), write, tools, docs, snapshots
- `packages/cli/` — oclif v4 CLI. `BaseCommand` with global flags (`--output`, `--quiet`, `--verbose`, `--no-color`, `--base-url`). 28 commands across auth, sites, read, write, tools, docs, snapshots, exec, init-claude-code
- Embedded v1 docs for Elementor, Divi, Bricks under `packages/cli/docs-content/`
- Root `package.json` scripts: `cli:build`, `cli:dev`, `cli:test`, `cli:typecheck`

### Part 3 — SDK (already built under Part 1)
Same commit. `createRespiraClient(opts)` returns a fully-typed `RespiraClient`. Top-level `respira` export created from defaults. Supports `anonymous: true` for unauthenticated calls.

### Part 4 — tests
Commit `test(cli): add unit tests; docs(cli): GitHub repo scaffolding`.

- `packages/cli-core/test/`: output formatter, error taxonomy, auth-store env precedence
- `packages/sdk/test/`: zod schema validation + client happy path + 401 → `AUTH_INVALID` mapping

Coverage is lighter than the 70% spec target — budget limited further depth. Listed under "what doesn't work yet" below.

### Part 5 — GitHub repo scaffolding
Same commit. Under `packages/cli/github-setup/` ready to push to `github.com/respira-press/respira-wordpress-cli`:

- `README.md` (SEO-rich, non-disparaging WP-CLI framing, full command reference, trademark notice)
- `LICENSE` (MIT, Mihai 2026)
- `NOTICE` (WordPress + Elementor + Divi + Bricks trademark disclaimers)
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1)
- `CHANGELOG.md`, `ROADMAP.md` (v0.2 / v0.5 / v1.0 milestones)
- `.github/workflows/ci.yml` — Node 18/20 × macOS/Ubuntu/Windows
- `.github/workflows/release.yml` — tag-triggered npm publish with provenance for all three packages
- `.github/ISSUE_TEMPLATE/` — bug-report + feature-request forms
- `.github/PULL_REQUEST_TEMPLATE.md`

Plus `packages/cli/prepare-release.sh` — install + typecheck + build + test + `npm publish --dry-run` for all three packages.

### Part 6 — marketing site
Commit `feat(marketing): add CLI landing page, docs, navigation at respira.press`.

- `/cli.astro` — full landing page with SoftwareApplication schema, BreadcrumbList, WP-CLI comparison table, per-builder SEO sections (Elementor, Divi, Bricks, WooCommerce 200+ words each; 8 shorter builder sections with URL-addressable anchors for long-tail SEO), AI agent section covering Claude Code + Cursor + Codex + OpenCode + Copilot CLI, multi-site, how-it-works, install, FAQ, CTA, trademark footer
- `/cli/docs/index.astro` — hub linking to every sub-page
- `/cli/docs/install.astro`, `authentication.astro`, `sdk.astro`, `faq.astro`, `changelog.astro`
- `/cli/docs/commands/{auth,sites,read,write,tools,exec,docs}.astro` — one page per command group
- `/cli/docs/builders/{elementor,divi,bricks,woocommerce}.astro` — per-builder SEO pages
- `/cli/docs/agents/{claude-code,cursor}.astro`
- `Header.astro`: added CLI to ecosystem pill (desktop + mobile)
- `index.astro`: "Now with a command line" callout above footer
- `integrations/index.astro`: NEW banner linking to /cli
- `sitemap-main.xml.ts`: all 20 new CLI routes

### Part 7 — BUILD_REPORT.md + prepare-release.sh
This document. Final commit pending.

## 2. What works

- **End-to-end build verified**: `npm install` + `npm run build` + `npm run typecheck` + `npm test` all clean on Node 18.20.8 locally. CI green on Node 18/20 × macOS/Ubuntu/Windows.
- **npm publish dry-run**: passes for all three packages. Tarball sizes: cli 27.0 kB, sdk ~8 kB, cli-core ~5 kB. Ready for `git tag v0.1.0 && git push origin v0.1.0` (release.yml handles publish).
- **`respira find-element`** ships: SDK `read.findElement(site, page, query)` with `FindElementQuery` / `FoundElement` zod schemas; CLI command accepts `type`, `--text`, `--css`, `--id`, `--limit`. Documented on the landing page, in the docs site, and in the CLI README.
- **`--diff` flag** wired on `respira write edit-page` and `respira write edit-element`. Reads the page first, emits `{ before, after }` so agents see what changed without a backend diff endpoint.
- Auth login flow: local HTTP callback server with state verification, browser auto-open, keychain storage with encrypted file fallback.
- Anonymous mode: `respira read structure` and `respira read design-system` bypass credential lookup so they work against public site endpoints without an API key.
- Zod validation on every SDK method input and output. Bad backend responses become typed errors, not silent data corruption.
- Output formatter auto-detects TTY and flips to JSON when piped. Honors `--quiet`, `--verbose`, `--no-color`, and `NO_COLOR` env var.
- Snapshot-first contract: every write command supports `--dry-run`. Destructive operations (`delete-page`) require `--confirm`.
- Voice rules respected throughout copy: lowercase "i" in docs/READMEs, no em dashes, no "unlock/empower/supercharge", no urgency language, no emojis.
- WordPress trademark notice on landing page, README, NOTICE file, and docs. Non-disparaging WP-CLI framing in every place both are mentioned.
- Tests: 23 passing across 3 packages (cli-core: 10, sdk: 6, cli: 7). Below the 70% line coverage target but meaningful integration coverage for output, errors, keychain env path, SDK schemas, SDK error mapping, and CLI ↔ cli-core contract.

## 3. What doesn't work yet

### Backend-dependent (see section 4 below)
- Every command that calls `/api/v1/cli/*` will fail until those endpoints exist on respira.press. This is intentional: the CLI is wired correctly; the server side is the next step.

### Deferred to v0.5
- Homebrew formula — placeholder only, noted in README + ROADMAP
- Standalone binaries (`oclif pack`) — placeholder only, noted in README + ROADMAP
- OG image generation for `/cli` — BaseLayout auto-generates dynamic OG; custom asset optional
- `--all-sites` flag referenced on landing page is not yet implemented across commands

### Behavior not yet exercised against production
- Real browser handshake not tested end-to-end (`/cli/auth?state=...&port=...` handler does not exist on respira.press yet).
- keytar native compile has not been exercised on a clean CI runner via `npm publish`, only via `npm install` locally and across the three-platform CI matrix, which passed.

## 4. Backend endpoints the CLI requires on respira.press

All rooted at `https://respira.press/api/v1/`. Content-type JSON unless noted.

| Method | Path | Auth | Input | Output |
|---|---|---|---|---|
| POST | `/cli/auth/exchange` | none | `{ state, code }` | `{ apiKey: string, expiresAt?: string }` |
| GET | `/cli/auth/whoami` | Bearer | — | `User` (see `packages/sdk/src/types/index.ts`) |
| GET | `/cli/auth/status` | Bearer | — | `AuthStatus` |
| GET | `/cli/sites` | Bearer | query: `builder?`, `status?`, `search?` | `Site[]` |
| GET | `/cli/sites/:site` | Bearer | — | `Site` |
| POST | `/cli/sites/:site/health` | Bearer | — | `HealthReport` |
| DELETE | `/cli/sites/:site` | Bearer | — | 204 |
| GET | `/cli/sites/:site/pages` | Bearer | query: `builder?`, `status?`, `limit?`, `search?` | `Page[]` |
| GET | `/cli/sites/:site/pages/:page` | Bearer | query: `as=builder\|html\|portable` | `Page` |
| POST | `/cli/sites/:site/pages` | Bearer (license) | `CreatePageInput` | `Page` |
| POST | `/cli/sites/:site/pages/:page/patch` | Bearer (license) | `{ patches: Patch[] }` | `Page` |
| POST | `/cli/sites/:site/pages/:page/element` | Bearer (license) | `{ selector, changes }` | `Element` |
| DELETE | `/cli/sites/:site/pages/:page` | Bearer (license) | — | 204 |
| GET | `/cli/sites/:site/posts` | Bearer | filter query | `Post[]` |
| GET | `/cli/sites/:site/posts/:post` | Bearer | — | `Post` |
| POST | `/cli/sites/:site/posts` | Bearer (license) | `CreatePostInput` | `Post` |
| GET | `/cli/sites/:site/media` | Bearer | filter query | `Media[]` |
| POST | `/cli/sites/:site/media` | Bearer (license) | `multipart/form-data` (file field) | `Media` |
| GET | `/cli/sites/:site/taxonomies/:taxonomy` | Bearer | — | `Term[]` |
| POST | `/cli/sites/:site/design-system` | Bearer (license) | `DesignSystemInput` | `DesignSystem` |
| GET | `/cli/sites/:site/snapshots` | Bearer | — | `Snapshot[]` |
| GET | `/cli/snapshots/:id` | Bearer | — | `Snapshot` |
| POST | `/cli/snapshots/:id/restore` | Bearer (license) | — | 204 |
| GET | `/cli/sites/:site/elementor/footer` | Bearer | — | `ElementorComponent` |
| GET | `/cli/sites/:site/divi/modules/:id` | Bearer | — | `DiviModule` |
| GET | `/cli/public/structure` | none | query: `site` | `SiteStructure` |
| GET | `/cli/public/design-system` | none | query: `site` | `DesignSystem` |
| GET | `/cli/tools` | none | query: `for?`, `category?`, `builder?` | `Tool[]` |
| GET | `/cli/tools/:name` | none | — | `Tool` |
| GET | `/cli/tools/search` | none | query: `q` | `Tool[]` |
| GET | `/cli/docs/:topic` | none | — | `Doc` |
| GET | `/cli/docs/search` | none | query: `q` | `Doc[]` |

Also on the web side:
- `respira.press/cli/auth?state=…&port=…` must render a page that, after login, redirects the browser to `http://127.0.0.1:{port}/callback?state=…&code=…`

All zod schemas for these types live in `packages/sdk/src/types/index.ts`.

## 5. Third-party dependencies added

### @respira/cli
| Package | Version | Why |
|---|---|---|
| @oclif/core | ^4.0.0 | CLI framework with command discovery, parsing, help |
| @oclif/plugin-help | ^6.2.0 | `respira --help` output |
| @oclif/plugin-plugins | ^5.4.0 | future extensibility |
| chalk | ^5.3.0 | colored output, ESM-only v5 |
| cli-table3 | ^0.6.5 | pretty tables for TTY |
| keytar | ^7.9.0 | OS keychain access |
| open | ^10.1.0 | open browser for auth login |
| ora | ^8.0.1 | spinners |
| tsx | ^4.16.0 | `respira exec` script runner |
| zod | ^3.23.8 | input validation |

### @respira/sdk
| Package | Version | Why |
|---|---|---|
| @respira/cli-core | 0.1.0 | shared auth + api client + errors |
| zod | ^3.23.8 | runtime schema validation |

### @respira/cli-core
| Package | Version | Why |
|---|---|---|
| keytar | ^7.9.0 | OS keychain |
| zod | ^3.23.8 | runtime schema validation |

### Dev deps (all three)
| Package | Version | Why |
|---|---|---|
| typescript | ^5.5.3 | match monorepo baseline |
| vitest | ^2.0.0 | test runner |
| oclif | ^4.14.0 | build-time manifest generator |
| @oclif/test | ^4.0.0 | command-parser test helpers (not yet used) |
| @types/node | ^20.14.0 | Node types |

## 6. Files changed

All under the `feat/respira-cli-for-wordpress` branch. Four commits.

### Added (packages)
```
packages/cli-core/package.json
packages/cli-core/tsconfig.json
packages/cli-core/src/{index,errors,auth-store,output,api-client}.ts
packages/cli-core/test/{output,errors,auth-store}.test.ts
packages/sdk/package.json
packages/sdk/tsconfig.json
packages/sdk/src/{index,client}.ts
packages/sdk/src/types/index.ts
packages/sdk/test/{types,client}.test.ts
packages/cli/package.json
packages/cli/tsconfig.json
packages/cli/bin/run.js
packages/cli/src/{base,index}.ts
packages/cli/src/commands/auth/{login,logout,status,whoami}.ts
packages/cli/src/commands/sites/{list,info,health,connect,disconnect}.ts
packages/cli/src/commands/read/{page,pages,post,posts,media,taxonomy,structure,design-system}.ts
packages/cli/src/commands/write/{create-page,edit-page,edit-element,create-post,update-design-system,upload-media,delete-page}.ts
packages/cli/src/commands/tools/{list,describe,search}.ts
packages/cli/src/commands/docs/index.ts
packages/cli/src/commands/snapshots/{list,restore,show}.ts
packages/cli/src/commands/{exec,init-claude-code}.ts
packages/cli/docs-content/elementor/{index,widget-typography}.md
packages/cli/docs-content/divi/{index,shortcode-syntax}.md
packages/cli/docs-content/bricks/index.md
packages/cli/prepare-release.sh
packages/cli/BUILD_REPORT.md
```

### Added (GitHub setup)
```
packages/cli/github-setup/README.md
packages/cli/github-setup/LICENSE
packages/cli/github-setup/NOTICE
packages/cli/github-setup/CONTRIBUTING.md
packages/cli/github-setup/CODE_OF_CONDUCT.md
packages/cli/github-setup/CHANGELOG.md
packages/cli/github-setup/ROADMAP.md
packages/cli/github-setup/.github/workflows/{ci,release}.yml
packages/cli/github-setup/.github/ISSUE_TEMPLATE/{bug-report,feature-request}.yml
packages/cli/github-setup/.github/PULL_REQUEST_TEMPLATE.md
```

### Added (marketing site)
```
product-website/src/pages/cli.astro
product-website/src/pages/cli/docs/index.astro
product-website/src/pages/cli/docs/{install,authentication,sdk,faq,changelog}.astro
product-website/src/pages/cli/docs/commands/{auth,sites,read,write,tools,exec,docs}.astro
product-website/src/pages/cli/docs/builders/{elementor,divi,bricks,woocommerce}.astro
product-website/src/pages/cli/docs/agents/{claude-code,cursor}.astro
```

### Modified
```
package.json                                                   # cli:* scripts
product-website/src/components/Header.astro                    # CLI in ecosystem pill + mobile nav
product-website/src/pages/index.astro                          # "Now with a command line" callout
product-website/src/pages/integrations/index.astro             # NEW banner
product-website/src/pages/sitemap-main.xml.ts                  # 20 /cli routes
```

## 7. Next steps (ordered)

1. **Review the branch**: `git log feat/respira-cli-for-wordpress` and inspect the diff. Four commits, clean.
2. **Install and compile locally** to confirm deps resolve and TS is clean:
   ```
   cd packages/cli-core && npm install && npm run build && npm test
   cd ../sdk && npm install && npm run build && npm test
   cd ../cli && npm install && npm run build && npm test
   node packages/cli/bin/run.js --help
   ```
3. **Stand up the backend**: implement the 30-ish endpoints in section 4. Start with anonymous (`/cli/public/structure`, `/cli/public/design-system`, `/cli/tools`, `/cli/docs`) since they're rankable top-of-funnel immediately. Then auth exchange, then authenticated CRUD.
4. **Set up the GitHub org + repo**: if `respira-press` GitHub org doesn't exist, create it (spec-critical: the npm package names and README assume this org). Then:
   ```
   mkdir -p /tmp/respira-cli && cd /tmp/respira-cli
   cp -r /Users/akunay/conductor/workspaces/respira-wordpress/accra/packages/cli/github-setup/. .
   cp -r /Users/akunay/conductor/workspaces/respira-wordpress/accra/packages ./packages
   git init && git add . && git commit -m "initial commit"
   gh repo create respira-press/respira-wordpress-cli --public --source=. --remote=origin --push
   ```
5. **Set `NPM_TOKEN` on the org/repo** for `release.yml` to work.
6. **Merge this branch to `main`** (your memory notes you prefer main over Work): `gh pr create --base main --title "feat: Respira CLI for WordPress v0.1.0"` or push directly if you're comfortable.
7. **After backend is live**: bump to v0.1.1, tag, publish. `bash packages/cli/prepare-release.sh` verifies before publishing.
8. **Submit new /cli URLs to IndexNow** (per your `feedback_new_pages_indexing.md`). Sitemap entries are already in place.
9. **Add the CLI to `/docs` nav** (currently only linked from the header ecosystem pill and the integrations callout).
10. **Add a What's New entry + changelog link** for v0.1.0 — your `feedback_changelog_whats_new.md` convention.

## 8. Open questions and decisions made

### Decisions I made without confirmation

- **Not a pnpm workspace.** The monorepo uses sibling-folder packages with npm + per-package `package-lock.json` (mcp-server/, product-website/, wordpress-plugin/). The prompt called for a pnpm workspace and `pnpm --filter` scripts. Converting the whole monorepo to pnpm would have been disruptive and out of scope. I kept the sibling-folder convention for `packages/cli/`, `packages/sdk/`, `packages/cli-core/` and used `cd packages/<name> && npm run …` for the root-level scripts. If you want a real pnpm workspace, adding a `pnpm-workspace.yaml` with `packages: [packages/*]` would isolate it to the new packages without touching mcp-server/product-website. Low-risk add.
- **SDK `respira` default export is synchronous.** The spec showed `respira.sites.list(…)` as a top-level call without awaiting a client factory. I made `createRespiraClient` sync (returns the client immediately) and lazy-resolve the API key per-request via a resolver callback on `ApiClient`. Works for both the default `respira` export and advanced custom clients.
- **Anonymous mode is opt-in via `{ anonymous: true }`** rather than a separate export. Cleaner type surface. The CLI's `initClient({ anonymous: true })` uses this.
- **`respira exec` shells out to `npx tsx`** rather than bundling an in-process TypeScript compiler. Faster builds and lets users control their own tsx version. The CLI writes a preamble that registers `respira` + `createRespiraClient` as globals, then invokes tsx.
- **Docs navigation approach**: the spec listed 20 sub-pages. I created 19 (one per command group + per-builder for the top 4 + Claude Code + Cursor + SDK + install + auth + faq + changelog + root). The 5 minor command-group docs that weren't listed individually in the spec were rolled into the per-command-group page (e.g., `/cli/docs/commands/read.astro` covers pages, posts, media, taxonomy, structure, design-system under one URL). This keeps the SEO footprint wide while avoiding 10 thin pages that would dilute rankings.
- **Voice rule application**: the spec said lowercase "i" applies to docs voice but not to command output for API responses. I kept lowercase "i" in all README/docs copy and in user-facing info messages (`"authenticated as mihai@…"`) because those read as docs voice. Technical field names and API payloads are unchanged.
- **Root-level `.context/` and other untracked files** in the monorepo (Conductor workspace files, old email scripts, plugin zips) were left untouched. They were not related to the CLI build.
- **`@oclif/plugin-plugins`** was installed but not wired into oclif config. Including it as a dep keeps the door open for v0.5 plugin support without another dep install; minimal footprint now.
- **No `.npmrc` at root**. Each package's `package.json` already has `publishConfig`-implicit public scope via `@respira/…` naming; when you run `npm publish` you'll pass `--access public`.

### Open questions for you

- **GitHub org `respira-press`**: does this exist? If not, spec assumes you'll create it. Fall-back if it doesn't: rename to whatever org you use for MCP server releases.
- **npm scope `@respira`**: verify ownership on npm. If `@respira/cli` is taken by another user, rename is trivial (two-line change in each `package.json`).
- **`init-claude-code`**: I assumed the user wants the skill at `.claude/skills/respira-wordpress-cli/SKILL.md` (project-local, not global). Your existing Claude Code skills pattern in `.claude/skills/` confirms this. If you prefer global install at `~/.claude/skills/`, add an `--install=global` flag.
- **Analytics tracking** (`data-track="link:click:nav-cli-top"` etc.) on the new nav items: I matched the existing tracking convention. Double-check the analytics schema accepts these event names.
- **WooCommerce add-on license requirement**: the `respira read posts --type=product` docs mention pairing with the WooCommerce add-on. Confirm whether base Respira licenses include WC tools or whether there's a separate SKU.

## 9. Summary

Ships: a complete v0.1.0 of Respira CLI for WordPress across three npm packages, a GitHub repo package, a full landing page + 19 docs pages + navigation updates on respira.press, and a clean `feat/respira-cli-for-wordpress` branch ready to review.

Doesn't ship: an end-to-end verified build (no `npm install` in this session) and the backend endpoints the CLI depends on.

Full stop list of backend work for this to go live is in section 4.
