# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-19

### Added

- initial release of Respira CLI for WordPress
- `@respira/cli` with commands for auth, sites, read, write, tools, docs, snapshots, exec, init-claude-code
- `respira find-element`: search a page tree by type, text, CSS class, or id
- `--diff` flag on `respira write edit-page` and `respira write edit-element` for client-side before/after output
- `@respira/sdk` typed client for Node.js 18+ with zod validation on every method
- `@respira/cli-core` shared auth store (OS keychain with encrypted file fallback), output formatter, and API client with retry plus rate-limit handling
- anonymous mode for `respira read structure` and `respira read design-system` against any public WordPress URL
- embedded v1 documentation content for Elementor, Divi, and Bricks
- `respira init-claude-code` generates a `.claude/` skill and companion commands
- npm workspaces at the repo root; build + test verified end-to-end on Node 18 and 20
- CI on macOS, Ubuntu, and Windows; tag-triggered release workflow with npm provenance

### Known limitations

- backend API endpoints under `/api/v1/cli/*` are not yet live. commands that require the backend will fail until those endpoints ship.
- no Homebrew formula yet
- no standalone binaries yet
