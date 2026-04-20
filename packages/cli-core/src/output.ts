import { formatSuccess, formatError, formatWarning, formatProgress, paint } from './formatter.js';
import pc from 'picocolors';

export type OutputFormat = 'json' | 'table' | 'yaml' | 'auto';

export interface OutputOptions {
  format?: OutputFormat;
  quiet?: boolean;
  verbose?: boolean;
  noColor?: boolean;
  isTTY?: boolean;
}

export interface OutputWriter {
  json(data: unknown): void;
  table(rows: Record<string, unknown>[], columns?: string[]): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
  debug(message: string): void;
}

export function resolveFormat(opts: OutputOptions): Exclude<OutputFormat, 'auto'> {
  if (opts.format && opts.format !== 'auto') return opts.format;
  return opts.isTTY ?? process.stdout.isTTY ? 'table' : 'json';
}

export function createOutput(opts: OutputOptions = {}): OutputWriter {
  const format = resolveFormat(opts);
  const quiet = opts.quiet ?? false;
  const verbose = opts.verbose ?? false;

  return {
    json(data: unknown) {
      if (quiet) return;
      process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    },
    table(rows: Record<string, unknown>[], columns?: string[]) {
      if (quiet) return;
      if (format === 'json') {
        process.stdout.write(JSON.stringify(rows, null, 2) + '\n');
        return;
      }
      if (rows.length === 0) {
        process.stdout.write('(no results)\n');
        return;
      }
      // Soft-aligned columns with dim horizontal divider per Part 2f voice rules.
      // No vertical pipes, no boxed borders. Headers in dim, divider in dim,
      // rows in default. Falls back to plain spacing when color is disabled.
      const cols = columns ?? Object.keys(rows[0]!);
      const widths = cols.map((c) =>
        Math.max(c.length, ...rows.map((r) => formatCell(r[c]).length)),
      );
      const headerLine = '  ' + cols.map((c, i) => c.padEnd(widths[i])).join('   ');
      const dividerLine = '  ' + widths.map((w) => '─'.repeat(w)).join('   ');
      process.stdout.write(paint(headerLine, pc.dim) + '\n');
      process.stdout.write(paint(dividerLine, pc.dim) + '\n');
      for (const row of rows) {
        const cells = cols.map((c, i) => formatCell(row[c]).padEnd(widths[i])).join('   ');
        process.stdout.write('  ' + cells + '\n');
      }
    },
    info(message: string) {
      if (quiet) return;
      process.stderr.write(formatProgress(message) + '\n');
    },
    warn(message: string) {
      if (quiet) return;
      process.stderr.write(formatWarning(message) + '\n');
    },
    error(message: string) {
      // Errors always print, even with --quiet. Caller can pass a multi-line
      // message of the shape "what went wrong\n  remediation" produced by
      // formatError(); we print it through unchanged so the remediation lands
      // on its own dim line.
      const lines = message.split('\n');
      const head = lines[0] ?? '';
      const tail = lines.slice(1).join('\n');
      const formatted = formatError(head, tail || undefined);
      process.stderr.write(formatted + '\n');
    },
    success(message: string) {
      if (quiet) return;
      process.stderr.write(formatSuccess(message) + '\n');
    },
    debug(message: string) {
      if (!verbose) return;
      process.stderr.write(`[debug] ${message}\n`);
    },
  };
}

function formatCell(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}
