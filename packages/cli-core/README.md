# @respira/cli-core

<p align="center">
  <img src="https://respira.press/hero/cli-hero.jpg" alt="Respira CLI for WordPress" width="900" />
</p>

**Shared primitives for Respira CLI for WordPress.**

`@respira/cli-core` ships the low-level building blocks that [`@respira/cli`](https://www.npmjs.com/package/@respira/cli) and [`@respira/sdk`](https://www.npmjs.com/package/@respira/sdk) are built on. If you are building a custom CLI, a CI plugin, an agent integration, or a v0.2 extension on top of Respira, this is the package you install.

Most users want [`@respira/cli`](https://www.npmjs.com/package/@respira/cli) (the oclif CLI) or [`@respira/sdk`](https://www.npmjs.com/package/@respira/sdk) (the typed client) instead.

[![npm version](https://img.shields.io/npm/v/@respira/cli-core.svg)](https://www.npmjs.com/package/@respira/cli-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@respira/cli-core.svg)](https://nodejs.org/)

```bash
npm install @respira/cli-core
```

## What's inside

Every name exported from `@respira/cli-core` is frozen for v0.1. v0.2 will add concrete implementations on top (`ManifestBackedHookRegistry`, `SqliteToolRegistry`, etc.) without renaming or changing signatures.

### Execution cycle

The six-phase runtime that powers every `respira` command.

```
LoadContext -> PreHooks -> Resolve -> Execute -> PostHooks -> Return
```

```typescript
import { ExecutionCycle, CyclePhase, NullHookRegistry } from '@respira/cli-core';

const cycle = new ExecutionCycle({
  hookRegistry: new NullHookRegistry(),
  verbose: true,
});

const result = await cycle.run(myToolChainFunction, input, ctx);
```

Exports: `ExecutionCycle`, `CyclePhase`, `CycleContext`, `CycleResult`, `ExecutionCycleOptions`.

### Framework hooks (v0.1 contracts, v0.2 callbacks)

Five named hooks fire on every invocation. In v0.1 the registry is null. v0.2 adds callback registration.

```typescript
import {
  FrameworkHook,
  HookType,
  NullHookRegistry,
  type HookDeclaration,
  type Callback,
  type HookRegistry,
} from '@respira/cli-core';

// FrameworkHook.BeforeResolve, FrameworkHook.FilterPlan,
// FrameworkHook.BeforeExecute, FrameworkHook.FilterResult, FrameworkHook.AfterExecute
```

### Tool Chain Functions

The typed abstraction each CLI command routes through.

```typescript
import type {
  ToolChainFunction,
  Capability,
  Prerequisite,
  DomainTag,
} from '@respira/cli-core';

export const myFunction: ToolChainFunction<MyReturnType> = {
  name: 'custom.op',
  description: 'do the thing',
  domainTags: ['pages', 'read', 'public'],
  capability: 'read',
  prerequisites: [],
  async execute(input, ctx) {
    // ...
  },
};
```

Naming convention in the CLI: one `BaseCommand` subclass per file, one `ToolChainFunction` per file, always co-located. Named export `<camelCasePath>Function`. See [respira.press/cli/docs/architecture](https://respira.press/cli/docs/architecture) for the full convention.

### Structured tracing

JSON traces emitted to `~/.respira/traces/{invocationId}.json` when `--verbose` is passed.

```typescript
import { TraceEmitter, type TraceEntry } from '@respira/cli-core';

const trace = new TraceEmitter();
trace.record({ phase: 'execute', event: 'tool_chain_executed', status: 'ok' });
await trace.writeToFile('/tmp/invocation.json');
```

Hard cap 10,000 entries per invocation to guard against runaway recursion.

### Error taxonomy

Two layers of typed errors.

```typescript
import {
  RespiraError,
  isRespiraError,
  CycleError,
  CycleErrorCode,
  isCycleError,
} from '@respira/cli-core';

// user-facing RespiraError codes are preserved as `cause` on CycleError
try {
  await cycle.run(fn, input, ctx);
} catch (err) {
  if (isCycleError(err) && isRespiraError(err.cause)) {
    console.error(err.cause.hint);
  }
}
```

### Auth and site stores

- `AuthStore`: OS keychain with encrypted file fallback (`~/.respira/credentials`). Reads `RESPIRA_API_KEY` env first.
- `SitesStore`: local site inventory at `~/.respira/sites.json` so the CLI can `sites list` without a network round-trip.

### Output writer

JSON, table, YAML, and auto-detecting TTY-friendly formatting. Used across every CLI command for consistent output.

```typescript
import { createOutputWriter } from '@respira/cli-core';

const out = createOutputWriter({ format: 'table' });
out.table([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
```

### API client

Fetch-based HTTP client with retry, rate-limit handling, and typed error mapping to `RespiraError`.

```typescript
import { createApiClient } from '@respira/cli-core';

const api = createApiClient({
  baseUrl: 'https://respira.press/api/v1',
  apiKey: '...',
});

const { data } = await api.get<MyType>('/some/route');
```

## What's in v0.2

Additive, no breaking changes:

- `ManifestBackedHookRegistry` replaces `NullHookRegistry`. Extension manifests. Callback registration.
- Priority resolution at hook firing time.
- SQLite-backed tool registry with FTS5. `ToolChainFunction` interface unchanged; only the lookup mechanism changes.
- Internal hook firing based on `ToolChainFunction.internalHooks` (field already exists in v0.1).
- Site inventory probe in `LoadContext`. Prerequisite enforcement in `Resolve`.

See [respira.press/cli/docs/architecture](https://respira.press/cli/docs/architecture) and [respira.press/cli/docs/hooks](https://respira.press/cli/docs/hooks).

## Companion packages

- [`@respira/cli`](https://www.npmjs.com/package/@respira/cli): the oclif CLI. 34 commands across 9 topics. What most people install.
- [`@respira/sdk`](https://www.npmjs.com/package/@respira/sdk): the typed TypeScript client. Use from scripts, CI, or agent frameworks.

## Docs

- [Architecture](https://respira.press/cli/docs/architecture)
- [Hooks](https://respira.press/cli/docs/hooks)
- [Changelog](https://respira.press/cli/docs/changelog)
- [GitHub](https://github.com/respira-press/respira-wordpress-cli)

## License

MIT. Node.js 18 or later. Works on macOS, Linux, and Windows.

---

WordPress is a registered trademark of the WordPress Foundation. Respira is an independent open-source project and is not affiliated with, endorsed by, or sponsored by WordPress.org, Automattic, or the WordPress Foundation.
