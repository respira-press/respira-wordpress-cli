# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-19

### Foundation release

Respira CLI v0.1.0 ships with an explicit execution cycle, framework-level hook contracts, and a typed Tool Chain Function abstraction. v0.2 adds callback registration and extension manifests additively on top.

### Architecture

- Six-phase execution cycle: `LoadContext -> PreHooks -> Resolve -> Execute -> PostHooks -> Return`. Deterministic. Traceable. Every command runs through every phase.
- Five framework hook contracts, frozen for v0.1: `before_resolve`, `filter_plan`, `before_execute`, `filter_result`, `after_execute`. In v0.1 no callbacks register. v0.2 populates them. The code path is hot in v0.1 so the v0.1 to v0.2 transition is a one-line swap of `NullHookRegistry` for `ManifestBackedHookRegistry` inside the cycle.
- Typed `ToolChainFunction<T>` abstraction for all 34 commands. Each function declares capability (`read` | `write` | `destructive`), domain tags (builder, domain, capability, access), and prerequisites.
- File-organization convention: one `BaseCommand` subclass per file, one `ToolChainFunction` per file, always co-located. Named export `<camelCasePath>Function`.
- Structured JSON tracing via `--verbose`, written to `~/.respira/traces/{invocationId}.json`. Hard cap 10,000 entries per invocation.
- `CycleError` wrapper preserves `RespiraError` as `cause` so user-facing messages stay familiar while `--verbose` tracing exposes phase context.

### Commands

- 34 commands across 9 topics (auth 4, sites 5, read 8, write 7, snapshots 3, tools 3, find-element 1, exec 1, docs 1, init-claude-code 1).
- `@respira/cli` with commands for auth, sites, read, write, tools, docs, snapshots, exec, init-claude-code.
- `respira find-element`: search a page tree by type, text, CSS class, or id.
- `--diff` flag on `respira write edit-page` and `respira write edit-element` for client-side before/after output.
- `--verbose` flag on every command emits a JSON trace to `~/.respira/traces/`.
- `respira init-claude-code` generates a `.claude/` skill and companion commands.
- Anonymous mode for `respira read structure` and `respira read design-system` against any public WordPress URL.
- Embedded v1 documentation content for Elementor, Divi, and Bricks.

### Packages

- `@respira/cli` 0.1.0: oclif CLI, 34 commands.
- `@respira/sdk` 0.1.0: typed TypeScript client for Node.js 18+ with zod validation on every method.
- `@respira/cli-core` 0.1.0: execution cycle, hook contracts, tool chain function interface, trace emitter, error taxonomy, auth store (OS keychain with encrypted file fallback), output formatter, API client with retry + rate-limit handling.

### Tests + CI

- 52 tests across the three packages. 28 new unit tests for the v0.1 scaffolding (execution cycle, hooks, tool chain functions, tracing).
- npm workspaces at repo root. Build + test verified on Node 18 and 20.
- CI on macOS, Ubuntu, and Windows. Tag-triggered release workflow with npm provenance.

### Known limitations

- backend API endpoints under `/api/v1/cli/*` are live for anonymous routes and auth handshake. Remaining sites/read/write/snapshot routes return typed `501 NOT_IMPLEMENTED` until the WordPress plugin bridge ships.
- no Homebrew formula yet
- no standalone binaries yet

### Docs

- Architecture: [respira.press/cli/docs/architecture](https://respira.press/cli/docs/architecture)
- Hooks: [respira.press/cli/docs/hooks](https://respira.press/cli/docs/hooks)
- Changelog: [respira.press/cli/docs/changelog](https://respira.press/cli/docs/changelog)
