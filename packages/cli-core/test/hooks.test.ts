import { describe, expect, it } from 'vitest';
import {
  FrameworkHook,
  HookType,
  NullHookRegistry,
  type HookRegistry,
} from '../src/hooks.js';

describe('FrameworkHook', () => {
  it('exposes exactly five framework-level hooks, frozen for v0.1', () => {
    expect(Object.keys(FrameworkHook).sort()).toEqual(
      ['AfterExecute', 'BeforeExecute', 'BeforeResolve', 'FilterPlan', 'FilterResult'].sort(),
    );
    expect(FrameworkHook.BeforeResolve).toBe('before_resolve');
    expect(FrameworkHook.FilterPlan).toBe('filter_plan');
    expect(FrameworkHook.BeforeExecute).toBe('before_execute');
    expect(FrameworkHook.FilterResult).toBe('filter_result');
    expect(FrameworkHook.AfterExecute).toBe('after_execute');
  });
});

describe('HookType', () => {
  it('distinguishes action and filter hooks', () => {
    expect(HookType.Action).toBe('action');
    expect(HookType.Filter).toBe('filter');
  });
});

describe('NullHookRegistry', () => {
  it('satisfies the HookRegistry interface', () => {
    const registry: HookRegistry = new NullHookRegistry();
    expect(typeof registry.callbacks).toBe('function');
    expect(typeof registry.declarations).toBe('function');
  });

  it('returns an empty array from callbacks() for every framework hook', () => {
    const registry = new NullHookRegistry();
    for (const name of Object.values(FrameworkHook)) {
      expect(registry.callbacks(name)).toEqual([]);
    }
  });

  it('returns an empty array from callbacks() for unknown names', () => {
    const registry = new NullHookRegistry();
    expect(registry.callbacks('filter_arbitrary_custom_hook')).toEqual([]);
    expect(registry.callbacks('')).toEqual([]);
  });

  it('returns an empty array from declarations() for any function name', () => {
    const registry = new NullHookRegistry();
    expect(registry.declarations('read.structure')).toEqual([]);
    expect(registry.declarations('write.edit-page')).toEqual([]);
    expect(registry.declarations('')).toEqual([]);
  });

  it('returns fresh arrays each call (no shared mutable state)', () => {
    const registry = new NullHookRegistry();
    const first = registry.callbacks('anything');
    const second = registry.callbacks('anything');
    expect(first).not.toBe(second);
    expect(first).toEqual([]);
    expect(second).toEqual([]);
  });
});
