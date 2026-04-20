# Respira CLI roadmap

This is a living document. Feedback and issues welcome at https://github.com/respira-press/respira-wordpress-cli/issues.

## v0.2 — backend alignment

- backend routes under `/api/v1/cli/*` live on respira.press
- `respira auth login` browser handshake wired end-to-end
- snapshots integrated with write commands
- coverage: 80%+ on cli-core and sdk

## v0.5 — polish and reach

- Homebrew tap (`brew install respira-press/tap/respira`)
- standalone binaries for macOS, Linux, Windows via `oclif pack`
- `respira find-element` and `respira diff-snapshots` commands
- richer docs for Bricks, WooCommerce, Gutenberg
- `respira init-cursor` equivalent of init-claude-code

## v1.0 — stable API

- stable SDK surface with semver guarantees
- all 12 builder integrations at full parity with the MCP server
- built-in observability (`--metrics`)
- plugin system for custom commands
- production-ready CI pipelines documentation

## Not on the roadmap

- replicating WP-CLI's server-side admin commands (use WP-CLI for that)
- a Respira-owned WordPress host or deployment service
