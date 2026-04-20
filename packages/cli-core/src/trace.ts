/**
 * Structured trace emitter for the Respira CLI execution cycle.
 *
 * Entries accumulate during cycle execution. When --verbose is set, the full
 * trace is written to stderr as JSON and a file is saved to
 * `~/.respira/traces/{invocationId}.json`. Without --verbose the trace is
 * kept in memory and discarded at end of command.
 *
 * Frozen for v0.1.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CyclePhase } from './execution-cycle.js';

/**
 * Shape of every entry recorded during a cycle invocation. Timestamps are
 * filled in by TraceEmitter.record(); callers omit them.
 */
export interface TraceEntry {
  readonly timestamp: number;
  readonly phase: CyclePhase;
  readonly event:
    | 'phase_start'
    | 'phase_end'
    | 'hook_fired'
    | 'callback_ran'
    | 'prerequisite_check'
    | 'tool_chain_executed'
    | 'error';
  readonly hookName?: string;
  readonly callbackExtension?: string;
  readonly callbackPriority?: number;
  readonly durationMs?: number;
  readonly status?: 'ok' | 'skipped' | 'error';
  readonly details?: Record<string, unknown>;
}

/**
 * Accumulates TraceEntry values and serializes them on demand.
 *
 * Thread-safety note: v0.1 is single-threaded. The emitter has no locking.
 * A sanity bound on entry count guards against runaway recursion in v0.2.
 */
export class TraceEmitter {
  static readonly MAX_ENTRIES = 10_000;

  private readonly entries: TraceEntry[] = [];

  /**
   * Append an entry. Fills in `timestamp` if the caller omitted it.
   * Silently drops entries past MAX_ENTRIES to prevent unbounded growth.
   */
  record(entry: Omit<TraceEntry, 'timestamp'> & { timestamp?: number }): void {
    if (this.entries.length >= TraceEmitter.MAX_ENTRIES) return;
    this.entries.push({
      timestamp: entry.timestamp ?? Date.now(),
      ...entry,
    });
  }

  /**
   * Read-only snapshot of all recorded entries. Returns the live array cast
   * to readonly so callers cannot mutate the store.
   */
  snapshot(): readonly TraceEntry[] {
    return this.entries;
  }

  /**
   * Count currently accumulated. Useful for guard checks between phases.
   */
  get size(): number {
    return this.entries.length;
  }

  /**
   * Clear all entries. Intended for test isolation; production code should
   * discard the emitter instance instead.
   */
  reset(): void {
    this.entries.length = 0;
  }

  /**
   * Serialize to a plain JSON-safe object. The wrapper carries metadata the
   * file format may want to grow in v0.2 (schema version, hostnames, etc.)
   * without breaking existing consumers.
   */
  toJSON(): {
    version: 1;
    entries: readonly TraceEntry[];
  } {
    return {
      version: 1,
      entries: this.entries,
    };
  }

  /**
   * Write the trace to a file, creating parent directories as needed. Uses
   * path.join for portability (Windows path handling matters here).
   */
  async writeToFile(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    const body = JSON.stringify(this.toJSON(), null, 2);
    await writeFile(filePath, body, 'utf8');
  }
}
