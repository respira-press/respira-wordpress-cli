import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TraceEmitter } from '../src/trace.js';
import { CyclePhase } from '../src/execution-cycle.js';

describe('TraceEmitter', () => {
  it('fills in timestamp when the caller omits it', () => {
    const emitter = new TraceEmitter();
    const before = Date.now();
    emitter.record({ phase: CyclePhase.LoadContext, event: 'phase_start' });
    const after = Date.now();
    const entry = emitter.snapshot()[0];
    expect(entry).toBeDefined();
    expect(entry!.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry!.timestamp).toBeLessThanOrEqual(after);
  });

  it('respects an explicit timestamp', () => {
    const emitter = new TraceEmitter();
    emitter.record({
      phase: CyclePhase.Execute,
      event: 'tool_chain_executed',
      timestamp: 42,
    });
    expect(emitter.snapshot()[0]!.timestamp).toBe(42);
  });

  it('accumulates entries in call order', () => {
    const emitter = new TraceEmitter();
    emitter.record({ phase: CyclePhase.LoadContext, event: 'phase_start' });
    emitter.record({ phase: CyclePhase.LoadContext, event: 'phase_end', status: 'ok' });
    emitter.record({ phase: CyclePhase.PreHooks, event: 'phase_start' });
    expect(emitter.size).toBe(3);
    expect(emitter.snapshot().map((e) => e.event)).toEqual([
      'phase_start',
      'phase_end',
      'phase_start',
    ]);
  });

  it('serializes to a versioned JSON envelope', () => {
    const emitter = new TraceEmitter();
    emitter.record({ phase: CyclePhase.Execute, event: 'tool_chain_executed', status: 'ok' });
    const json = emitter.toJSON();
    expect(json.version).toBe(1);
    expect(json.entries).toHaveLength(1);
    expect(json.entries[0]!.event).toBe('tool_chain_executed');
  });

  it('resets entries on demand', () => {
    const emitter = new TraceEmitter();
    emitter.record({ phase: CyclePhase.LoadContext, event: 'phase_start' });
    expect(emitter.size).toBe(1);
    emitter.reset();
    expect(emitter.size).toBe(0);
  });

  it('drops entries past MAX_ENTRIES instead of growing unbounded', () => {
    const emitter = new TraceEmitter();
    for (let i = 0; i < TraceEmitter.MAX_ENTRIES + 500; i += 1) {
      emitter.record({ phase: CyclePhase.Execute, event: 'phase_start' });
    }
    expect(emitter.size).toBe(TraceEmitter.MAX_ENTRIES);
  });

  describe('writeToFile', () => {
    let dir: string;

    beforeEach(async () => {
      dir = await mkdtemp(join(tmpdir(), 'respira-trace-'));
    });

    afterEach(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it('creates parent directories and writes JSON', async () => {
      const emitter = new TraceEmitter();
      emitter.record({ phase: CyclePhase.Return, event: 'phase_end', status: 'ok' });
      const file = join(dir, 'nested', 'dir', 'trace.json');
      await emitter.writeToFile(file);
      const body = await readFile(file, 'utf8');
      const parsed = JSON.parse(body);
      expect(parsed.version).toBe(1);
      expect(parsed.entries[0].event).toBe('phase_end');
    });
  });
});
