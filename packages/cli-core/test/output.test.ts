import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveFormat, createOutput } from '../src/output.js';

describe('resolveFormat', () => {
  it('respects explicit format', () => {
    expect(resolveFormat({ format: 'json' })).toBe('json');
    expect(resolveFormat({ format: 'table' })).toBe('table');
  });

  it('picks json for non-TTY', () => {
    expect(resolveFormat({ format: 'auto', isTTY: false })).toBe('json');
  });

  it('picks table for TTY', () => {
    expect(resolveFormat({ format: 'auto', isTTY: true })).toBe('table');
  });
});

describe('createOutput', () => {
  const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  afterEach(() => spy.mockClear());

  it('json() writes JSON with trailing newline', () => {
    const out = createOutput({ isTTY: false });
    out.json({ hello: 'world' });
    expect(spy).toHaveBeenCalledWith('{\n  "hello": "world"\n}\n');
  });

  it('quiet suppresses json output', () => {
    const out = createOutput({ quiet: true, isTTY: false });
    out.json({ hello: 'world' });
    expect(spy).not.toHaveBeenCalled();
  });
});
