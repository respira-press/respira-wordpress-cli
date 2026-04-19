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
      const cols = columns ?? Object.keys(rows[0]!);
      const header = cols.join('\t');
      process.stdout.write(header + '\n');
      for (const row of rows) {
        process.stdout.write(cols.map((c) => formatCell(row[c])).join('\t') + '\n');
      }
    },
    info(message: string) {
      if (quiet) return;
      process.stderr.write(message + '\n');
    },
    warn(message: string) {
      if (quiet) return;
      process.stderr.write(`warning: ${message}\n`);
    },
    error(message: string) {
      process.stderr.write(`error: ${message}\n`);
    },
    success(message: string) {
      if (quiet) return;
      process.stderr.write(message + '\n');
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
