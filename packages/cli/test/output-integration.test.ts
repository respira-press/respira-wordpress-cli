import { describe, it, expect, vi, afterEach } from 'vitest';
import { createOutput, resolveFormat } from '@respira/cli-core';

describe('output formatter as used by CLI', () => {
  const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  afterEach(() => {
    stdoutSpy.mockClear();
    stderrSpy.mockClear();
  });

  it('table() degrades to JSON when not in a TTY', () => {
    const out = createOutput({ isTTY: false });
    out.table([{ a: 1, b: 'x' }]);
    const call = stdoutSpy.mock.calls[0]?.[0] as string;
    expect(call).toContain('"a": 1');
    expect(call).toContain('"b": "x"');
  });

  it('table() renders aligned columns when in a TTY', () => {
    const out = createOutput({ isTTY: true });
    out.table([{ name: 'foo', count: 3 }]);
    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
    const calls = stripAnsi(stdoutSpy.mock.calls.map((c) => c[0]).join(''));
    expect(calls).toContain('name');
    expect(calls).toContain('count');
    expect(calls).toContain('foo');
    expect(calls).toContain('3');
  });

  it('success() goes to stderr with the check glyph', () => {
    const out = createOutput({ isTTY: true });
    out.success('hello');
    const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');
    const written = stripAnsi(stderrSpy.mock.calls[0]?.[0] as string);
    expect(written).toBe('✓ hello\n');
    expect(stdoutSpy).not.toHaveBeenCalled();
  });

  it('debug() is silent unless verbose is true', () => {
    const out = createOutput({ verbose: false });
    out.debug('should not appear');
    expect(stderrSpy).not.toHaveBeenCalled();

    const out2 = createOutput({ verbose: true });
    out2.debug('should appear');
    expect(stderrSpy).toHaveBeenCalledWith('[debug] should appear\n');
  });

  it('resolveFormat prefers explicit format over auto', () => {
    expect(resolveFormat({ format: 'json', isTTY: true })).toBe('json');
    expect(resolveFormat({ format: 'table', isTTY: false })).toBe('table');
  });
});
