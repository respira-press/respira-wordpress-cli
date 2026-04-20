# @respira/cli

<p align="center">
  <img src="https://respira.press/hero/cli-hero.jpg" alt="Respira CLI for WordPress" width="900" />
</p>

**The WordPress CLI for the AI coding agent era.**

Respira CLI is a modern WordPress command line interface built for developers working with AI coding agents like Claude Code, Cursor, and Codex. It understands Elementor, Divi, Bricks, WPBakery, Beaver Builder, Oxygen, Breakdance, Brizy, Thrive Architect, Flatsome, Gutenberg, and WooCommerce. It runs on your local machine. It never requires SSH.

Built on a WordPress-native execution cycle. Extensions and callbacks arrive in v0.2.

[![npm version](https://img.shields.io/npm/v/@respira/cli.svg)](https://www.npmjs.com/package/@respira/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@respira/cli.svg)](https://nodejs.org/)
[![GitHub stars](https://img.shields.io/github/stars/respira-press/respira-wordpress-cli?style=social)](https://github.com/respira-press/respira-wordpress-cli)

```bash
npm install -g @respira/cli
respira auth login
respira sites list
```

## Not a WP-CLI replacement

Respira CLI is not a WP-CLI replacement. [WP-CLI](https://wp-cli.org) is excellent for server-side WordPress administration and the two tools are complementary.

| | WP-CLI | Respira CLI |
|---|---|---|
| Runs on | your WordPress server | your local machine |
| Transport | PHP / shell | Respira API over HTTPS |
| Requires SSH | yes | no |
| Understands page builder content | limited | yes, natively |
| Built for | sysadmin tasks | AI coding agent workflows |
| Works on managed hosts (WP Engine, Kinsta) | yes, with shell access | yes, always |

Use WP-CLI for server maintenance. Use Respira CLI for builder-native content work driven by agents.

## Why Respira CLI

- **Local-first.** Runs on your Mac, Linux, or Windows workstation. No SSH.
- **Builder-native.** Reads and writes Elementor, Divi, Bricks, and more in their native formats, not as generic WordPress posts.
- **Agent-ready.** Scriptable through [`@respira/sdk`](https://www.npmjs.com/package/@respira/sdk), JSON-first output, a command surface designed for Claude Code and Cursor.
- **Safety-first.** Every destructive operation snapshots first. `--dry-run` and `--diff` on every write.
- **Deterministic.** Every command runs through a six-phase execution cycle with structured JSON tracing via `--verbose`.

## Architecture

Respira CLI is built on a six-phase execution cycle. Every command moves through the same deterministic runtime:

```
LoadContext -> PreHooks -> Resolve -> Execute -> PostHooks -> Return
```

In v0.1:

- **The execution cycle.** Six named phases. Every command runs through all of them. Nothing skips phases, nothing reorders them. Deterministic by design, traceable with `--verbose`.
- **The hook framework.** Five framework-level hook points are live: `before_resolve`, `filter_plan`, `before_execute`, `filter_result`, `after_execute`. In v0.1 no callbacks register here yet. The contracts are frozen. v0.2 adds callback registration and extension manifests on top, without changing anything you see in v0.1.
- **Tool Chain Functions.** Every command is a typed function with a capability class, domain tags, and prerequisite declarations. The cycle reads these and routes accordingly.
- **Structured tracing.** `--verbose` on any command emits a JSON trace of the invocation to `~/.respira/traces/`. Useful when a coding agent needs to understand why something did or did not do what was expected.

Full details at [respira.press/cli/docs/architecture](https://respira.press/cli/docs/architecture) and [respira.press/cli/docs/hooks](https://respira.press/cli/docs/hooks).

## Installation

```bash
npm install -g @respira/cli
# or
pnpm add -g @respira/cli
# or
yarn global add @respira/cli
```

Homebrew and standalone binaries are coming soon.

**Requires Node.js 18 or later.** Works on macOS, Linux, and Windows.

## Quick start

```bash
# 1. authenticate
respira auth login

# 2. connect a site
respira sites connect https://mysite.com

# 3. read a page
respira read page mysite.com about

# 4. list the tools available for your builder
respira tools list --for=elementor

# 5. run a script
respira exec scripts/audit.ts
```

## Builder-native

Manage any supported builder from the terminal. Read page trees as JSON, target any widget, and edit in place.

```bash
# Elementor
respira read page mysite.com about
respira write edit-element mysite.com about heading-123 --set=text="welcome"

# Divi 4 + Divi 5
respira write edit-element mysite.com home module-42 --set=text_font_size=48px

# Bricks
respira find-element mysite.com home --type=heading

# WooCommerce
respira read posts mysite.com --type=product --limit=100
respira write create-post mysite.com --type=product --title="new widget"

# Any public site, no account
respira read structure https://example.com
respira read design-system https://example.com
```

Respira CLI auto-detects your builder and exposes builder-aware tools.

## Command reference (34 commands)

### auth

```bash
respira auth login
respira auth logout
respira auth status
respira auth whoami
```

### sites

```bash
respira sites list
respira sites info <site>
respira sites health <site>
respira sites connect <url>
respira sites disconnect <site>
```

### read

```bash
respira read page <site> <page> [--as=builder|html|portable]
respira read pages <site> [--builder=elementor]
respira read post <site> <post>
respira read posts <site> [--type=product]
respira read media <site> [--type=image]
respira read taxonomy <site> <taxonomy>
respira read structure <site>        # works on any public site
respira read design-system <site>    # works on any public site
```

### write

```bash
respira write create-page <site> --title="..."
respira write edit-page <site> <page> --set=path=value
respira write edit-element <site> <page> <selector> --set=key=value
respira write create-post <site> --from-markdown=<file>
respira write update-design-system <site> --from=<file>
respira write upload-media <site> <file>
respira write delete-page <site> <page> --confirm
```

### tools, docs, snapshots, exec, find-element, init-claude-code

```bash
respira tools list
respira tools describe <id>
respira tools search <query>
respira docs <builder> [topic]
respira snapshots list <site>
respira snapshots show <id>
respira snapshots restore <id>
respira exec [script]
respira find-element <site> <page> [type]
respira init-claude-code
```

Run `respira <command> --help` for any command.

## Global flags on every command

- `--output=json|table|yaml|auto` (default `auto`, falls to `json` when stdout is piped)
- `--quiet`
- `--verbose` (writes a JSON trace to `~/.respira/traces/{uuid}.json`, logs trace path to stderr)
- `--no-color`
- `--base-url` (overrides `https://respira.press/api/v1`)

## Using with AI agents

### Claude Code

```bash
respira init-claude-code
```

Creates `.claude/skills/respira-wordpress-cli/SKILL.md` and a couple of shortcut commands in `.claude/commands/`. Claude Code picks up the skill automatically.

### Cursor

Point the Cursor MCP client at the Respira MCP server, or call `respira` directly from the terminal.

### CI and automation

Set `RESPIRA_API_KEY` in your CI environment.

```yaml
- name: audit production WordPress
  env:
    RESPIRA_API_KEY: ${{ secrets.RESPIRA_API_KEY }}
  run: |
    respira read structure https://mysite.com > audit.json
```

## Subscription tiers

- **Anonymous** (no license): `respira read structure` and `respira read design-system` against any public WordPress URL, `respira tools list`, `respira docs`.
- **Lite** (free): monthly write quota against your own connected sites.
- **Maker, Studio, Agency**: higher quotas and advanced tools. See [respira.press/pricing](https://respira.press/pricing).

## Companion packages

- [`@respira/sdk`](https://www.npmjs.com/package/@respira/sdk): the typed TypeScript client that powers this CLI. Use it directly in scripts, CI jobs, or agent frameworks.
- [`@respira/cli-core`](https://www.npmjs.com/package/@respira/cli-core): shared primitives: execution cycle, hook contracts, tool chain function interface, trace emitter, error taxonomy, auth and site stores.

## Docs

- [Documentation](https://respira.press/cli/docs)
- [Architecture](https://respira.press/cli/docs/architecture)
- [Hooks](https://respira.press/cli/docs/hooks)
- [Changelog](https://respira.press/cli/docs/changelog)
- [GitHub](https://github.com/respira-press/respira-wordpress-cli)

## Contributing

See [CONTRIBUTING.md](https://github.com/respira-press/respira-wordpress-cli/blob/main/CONTRIBUTING.md). The Respira community is on Discord and Slack. Join from [respira.press/community](https://respira.press/community).

## License

MIT. See [LICENSE](https://github.com/respira-press/respira-wordpress-cli/blob/main/LICENSE).

---

WordPress is a registered trademark of the WordPress Foundation. Respira CLI for WordPress is an independent open-source project and is not affiliated with, endorsed by, or sponsored by WordPress.org, Automattic, or the WordPress Foundation.

Built by Mihai Dragomirescu in Brașov, Romania. [respira.press](https://respira.press) · [@mihai_respira](https://twitter.com/mihai_respira) · [@Respira_press](https://twitter.com/Respira_press)
