import { describe, expect, it } from 'vitest';
import {
  CyclePhase,
  ExecutionCycle,
  type CycleContext,
} from '../src/execution-cycle.js';
import type { ToolChainFunction } from '../src/tool-chain-function.js';
import { CycleErrorCode } from '../src/cycle-errors.js';
import { TraceEmitter } from '../src/trace.js';
import { NullHookRegistry } from '../src/hooks.js';

function makeFn<T>(
  overrides: Partial<ToolChainFunction<T>> & {
    execute: ToolChainFunction<T>['execute'];
  },
): ToolChainFunction<T> {
  return {
    name: 'test.fn',
    description: 'unit test fixture',
    domainTags: [],
    capability: 'read',
    prerequisites: [],
    ...overrides,
  };
}

describe('ExecutionCycle.run', () => {
  it('returns status ok and the function output on the happy path', async () => {
    const cycle = new ExecutionCycle({ hookRegistry: new NullHookRegistry() });
    const fn = makeFn<{ value: number }>({
      async execute() {
        return { value: 42 };
      },
    });

    const result = await cycle.run(fn, undefined);
    expect(result.status).toBe('ok');
    expect(result.data).toEqual({ value: 42 });
    expect(result.invocationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.error).toBeUndefined();
  });

  it('records phase_start + phase_end entries for every phase in order', async () => {
    const emitter = new TraceEmitter();
    const cycle = new ExecutionCycle({ traceEmitter: emitter });
    const fn = makeFn({ async execute() { return 'done'; } });

    await cycle.run(fn, undefined);

    const starts = emitter.snapshot().filter((e) => e.event === 'phase_start').map((e) => e.phase);
    expect(starts).toEqual([
      CyclePhase.LoadContext,
      CyclePhase.PreHooks,
      CyclePhase.Resolve,
      CyclePhase.Execute,
      CyclePhase.PostHooks,
      CyclePhase.Return,
    ]);
    const ends = emitter.snapshot().filter((e) => e.event === 'phase_end');
    expect(ends).toHaveLength(6);
    expect(ends.every((e) => e.status === 'ok')).toBe(true);
  });

  it('catches a thrown error in Execute, wraps it in CycleError, never re-throws', async () => {
    const cycle = new ExecutionCycle();
    const fn = makeFn({
      async execute() {
        throw new Error('boom');
      },
    });

    const result = await cycle.run(fn, undefined);
    expect(result.status).toBe('error');
    expect(result.error?.code).toBe(CycleErrorCode.ToolChainError);
    expect(result.error?.message).toBe('boom');
    expect(result.data).toBeUndefined();
  });

  it('skips PostHooks when Execute fails but still records Return', async () => {
    const emitter = new TraceEmitter();
    const cycle = new ExecutionCycle({ traceEmitter: emitter });
    const fn = makeFn({
      async execute() {
        throw new Error('boom');
      },
    });

    await cycle.run(fn, undefined);

    const phases = emitter
      .snapshot()
      .filter((e) => e.event === 'phase_start')
      .map((e) => e.phase);
    expect(phases).toContain(CyclePhase.LoadContext);
    expect(phases).toContain(CyclePhase.PreHooks);
    expect(phases).toContain(CyclePhase.Resolve);
    expect(phases).toContain(CyclePhase.Execute);
    expect(phases).not.toContain(CyclePhase.PostHooks);
    expect(phases).toContain(CyclePhase.Return);
  });

  it('records a prerequisite_check event per declared prerequisite', async () => {
    const emitter = new TraceEmitter();
    const cycle = new ExecutionCycle({ traceEmitter: emitter });
    const fn = makeFn({
      prerequisites: [
        { type: 'license', required: true },
        { type: 'site_connected', required: true },
      ],
      async execute() { return 'ok'; },
    });

    await cycle.run(fn, undefined);

    const checks = emitter.snapshot().filter((e) => e.event === 'prerequisite_check');
    expect(checks).toHaveLength(2);
    expect(checks.every((c) => c.status === 'skipped')).toBe(true);
  });

  it('forwards switches and task metadata into the CycleContext the function sees', async () => {
    const cycle = new ExecutionCycle();
    let captured: CycleContext | null = null;
    const fn = makeFn({
      async execute(_input, ctx) {
        captured = ctx;
        return 'ok';
      },
    });

    await cycle.run(fn, { input: 'payload' }, {
      toolName: 'test toolname',
      switches: { verbose: true },
      task: { site: 'example.com' },
    });

    expect(captured).not.toBeNull();
    expect(captured!.toolName).toBe('test toolname');
    expect(captured!.switches).toEqual({ verbose: true });
    expect(captured!.task).toEqual({ site: 'example.com' });
  });
});
