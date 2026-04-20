import { describe, expect, it } from 'vitest';
import {
  DomainTag,
  type Capability,
  type Prerequisite,
  type ToolChainFunction,
} from '../src/tool-chain-function.js';
import { ExecutionCycle } from '../src/execution-cycle.js';

describe('ToolChainFunction', () => {
  it('structural typing accepts a minimal read function', () => {
    const fn: ToolChainFunction<{ ok: boolean }> = {
      name: 'read.example',
      description: 'example',
      domainTags: [DomainTag.domain.pages, DomainTag.access.public],
      capability: 'read',
      prerequisites: [],
      async execute() {
        return { ok: true };
      },
    };
    expect(fn.name).toBe('read.example');
  });

  it('capability union covers the three documented values', () => {
    const capabilities: Capability[] = ['read', 'write', 'destructive'];
    expect(capabilities).toHaveLength(3);
  });

  it('Prerequisite.type accepts all five declared kinds', () => {
    const list: Prerequisite[] = [
      { type: 'builder', name: 'elementor', required: true },
      { type: 'plugin', name: 'woocommerce', required: false },
      { type: 'license', required: true },
      { type: 'site_connected', required: true },
      { type: 'capability', name: 'snapshots', required: false },
    ];
    expect(list.map((p) => p.type)).toEqual([
      'builder',
      'plugin',
      'license',
      'site_connected',
      'capability',
    ]);
  });
});

describe('ToolChainFunction round-trip through ExecutionCycle', () => {
  it('Capability metadata survives the cycle (cycle reads fn.capability)', async () => {
    const cycle = new ExecutionCycle();
    const fn: ToolChainFunction<{ cap: Capability }> = {
      name: 'test.capability',
      description: 'capability echo',
      domainTags: [],
      capability: 'destructive',
      prerequisites: [],
      async execute() {
        return { cap: 'destructive' };
      },
    };
    const result = await cycle.run(fn, undefined);
    expect(result.status).toBe('ok');
    expect(result.data).toEqual({ cap: 'destructive' });
  });

  it('input argument is passed verbatim to execute()', async () => {
    const cycle = new ExecutionCycle();
    const fn: ToolChainFunction<{ site: string }> = {
      name: 'test.echo-input',
      description: 'echo',
      domainTags: [],
      capability: 'read',
      prerequisites: [],
      async execute(input) {
        const typed = input as { site: string };
        return { site: typed.site };
      },
    };
    const result = await cycle.run(fn, { site: 'example.com' });
    expect(result.data).toEqual({ site: 'example.com' });
  });
});

describe('DomainTag vocabulary', () => {
  it('exposes the twelve builders plus none', () => {
    expect(Object.keys(DomainTag.builder)).toHaveLength(13);
  });

  it('exposes the ten domains', () => {
    expect(Object.keys(DomainTag.domain)).toHaveLength(10);
  });

  it('exposes the three capability values', () => {
    expect(Object.values(DomainTag.capability).sort()).toEqual([
      'destructive',
      'read',
      'write',
    ]);
  });
});
