# Contributing to Respira CLI

Thanks for your interest. This is a solo-maintained project by Mihai Dragomirescu. That means contributions are welcome but reviewed slowly and with care.

## Dev setup

```bash
git clone https://github.com/respira-press/respira-wordpress-CLI
cd respira-wordpress-CLI
npm install
npm run build
node packages/cli/bin/run.js --help
```

Requires Node.js 18 or later.

## Project layout

```
packages/
  cli/         the oclif-based CLI (@respira/cli)
  sdk/         the typed SDK consumed by scripts (@respira/sdk)
  cli-core/    shared utilities (@respira/cli-core)
```

## Running a command during development

```bash
cd packages/cli
npm run dev           # tsc --watch
node bin/run.js auth status
```

## Proposing a new command

1. Open an issue describing the use case before writing code.
2. Follow the pattern in `src/commands/<topic>/<action>.ts`.
3. Keep global flags consistent. Extend `BaseCommand`.
4. Every new command needs a short description, at least one example, and JSON output.

## Adding a new builder docs page

Docs live in `packages/cli/docs-content/<builder>/<topic>.md`. Add the file, then verify the lookup in `src/commands/docs/index.ts` finds it.

## Running tests

```bash
npm run test
```

## Code style

- lowercase "i" in documentation voice (README, docs, command descriptions)
- no em dashes. use periods, commas, parentheses.
- no corporate jargon. no urgency tactics. no emojis.
- warm but direct. short sentences.

## Code of conduct

By participating you agree to the [Code of Conduct](./CODE_OF_CONDUCT.md).

## Licensing

Contributions are licensed under MIT.
