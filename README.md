# Respira CLI for WordPress

**The WordPress CLI for the AI coding agent era.**

Respira CLI is a modern WordPress command line interface built for developers working with AI coding agents like Claude Code, Cursor, and Codex. It understands Elementor, Divi, Bricks, WPBakery, Beaver Builder, Oxygen, Breakdance, Brizy, Thrive Architect, Flatsome, Gutenberg, and WooCommerce. It runs on your local machine. It never requires SSH.

[![npm version](https://img.shields.io/npm/v/@respira/cli.svg)](https://www.npmjs.com/package/@respira/cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/respira-press/respira-wordpress-CLI?style=social)](https://github.com/respira-press/respira-wordpress-CLI)

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

- **Local-first**: runs on your Mac, Linux, or Windows workstation. No SSH.
- **Builder-native**: reads and writes Elementor, Divi, Bricks, and more in their native formats, not as generic WordPress posts.
- **Agent-ready**: scriptable through `@respira/sdk`, JSON-first output, a command surface designed for Claude Code and Cursor.
- **Safety-first**: every destructive operation snapshots first. `--dry-run` and `--diff` on every write.

## Elementor CLI

Manage Elementor sites from the terminal. Read page trees as JSON, target any widget, and edit typography or layout in place.

```bash
respira read page mysite.com about
respira write edit-element mysite.com about heading-123 --set=text="welcome"
respira tools list --for=elementor
```

## Divi CLI

Divi 4 shortcodes and Divi 5 blocks, both handled. Respira CLI parses the tree so you edit attributes, not regex.

```bash
respira read page mysite.com home --as=html
respira write edit-element mysite.com home module-42 --set=text_font_size=48px
```

## Bricks CLI

Bricks Builder support with element-level targeting and global-class awareness.

```bash
respira read design-system mysite.com
respira find-element mysite.com home --type=heading
```

## WPBakery CLI

Read WPBakery shortcodes as structured JSON. Edit rows and columns without touching the raw content.

## Beaver Builder CLI, Oxygen CLI, Breakdance CLI, Brizy CLI, Thrive Architect CLI, Flatsome CLI

Respira CLI auto-detects your builder and exposes builder-aware tools. See [respira.press/cli](https://respira.press/cli) for per-builder documentation.

## WooCommerce CLI

Product catalog, orders, attributes, and store settings, all from the command line.

```bash
respira read posts mysite.com --type=product --limit=100
respira write create-post mysite.com --type=product --title="new widget"
```

## Gutenberg CLI

Native block editor support. Read blocks as JSON, edit attributes, or rewrite entire block trees.

## WordPress MCP CLI for AI coding agents

Respira CLI pairs with the Respira MCP server so Claude Code, Cursor, Codex, OpenCode, and GitHub Copilot CLI can all use the same tool surface.

```bash
respira init-claude-code          # sets up .claude/ in the current directory
```

## Installation

```bash
npm install -g @respira/cli
# or
pnpm add -g @respira/cli
# or
yarn global add @respira/cli
```

Homebrew and standalone binaries are coming soon.

**Requires Node.js 18 or later.**

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

## Command reference

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

### tools, docs, snapshots, exec, init-claude-code

See `respira <command> --help`.

## Using with AI agents

### Claude Code

```bash
respira init-claude-code
```

This creates `.claude/skills/respira-wordpress-cli/SKILL.md` and a couple of shortcut commands in `.claude/commands/`. Claude Code picks up the skill automatically.

### Cursor

Point the Cursor MCP client at the Respira MCP server or call `respira` directly from the terminal.

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

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The Respira community hangs out on Discord and Slack. Join from [respira.press/community](https://respira.press/community).

## License

MIT. See [LICENSE](./LICENSE).

---

WordPress is a registered trademark of the WordPress Foundation. Respira CLI for WordPress is an independent open-source project and is not affiliated with, endorsed by, or sponsored by WordPress.org, Automattic, or the WordPress Foundation.

Built by Mihai Dragomirescu in Brașov, Romania. [respira.press](https://respira.press) · [@mihai_respira](https://twitter.com/mihai_respira) · [@Respira_press](https://twitter.com/Respira_press)
