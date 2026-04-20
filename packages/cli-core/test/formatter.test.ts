import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatSuccess,
  formatError,
  formatWarning,
  formatProgress,
  renderWelcome,
  renderWelcomeShort,
  suggestCommand,
  levenshtein,
  GLYPH,
  TOTAL_TOOLS,
} from '../src/index.js';

// Strip ANSI escape codes so assertions can match plain text regardless of
// whether colors are enabled in the test environment.
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, '');

describe('formatter', () => {
  describe('formatSuccess', () => {
    it('prefixes with the check glyph', () => {
      const out = stripAnsi(formatSuccess('connected yoursite.com'));
      expect(out).toBe(`${GLYPH.check} connected yoursite.com`);
    });
  });

  describe('formatError', () => {
    it('prefixes with the cross glyph and one line', () => {
      const out = stripAnsi(formatError('not signed in'));
      expect(out).toBe(`${GLYPH.cross} not signed in`);
    });
    it('appends a remediation on its own indented line', () => {
      const out = stripAnsi(formatError('not signed in', 'run: respira auth login'));
      expect(out).toBe(
        [`${GLYPH.cross} not signed in`, '  run: respira auth login'].join('\n'),
      );
    });
  });

  describe('formatWarning', () => {
    it('prefixes with the warning glyph', () => {
      const out = stripAnsi(formatWarning('about to run this on 47 sites', 'continue? (y/N)'));
      expect(out).toBe(
        [`${GLYPH.warn} about to run this on 47 sites`, '  continue? (y/N)'].join('\n'),
      );
    });
  });

  describe('formatProgress', () => {
    it('indents two spaces', () => {
      const out = stripAnsi(formatProgress('opening browser to sign in...'));
      expect(out).toBe('  opening browser to sign in...');
    });
  });
});

describe('levenshtein + suggestCommand', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshtein('sites', 'sites')).toBe(0);
  });
  it('counts single-character substitutions', () => {
    expect(levenshtein('sites', 'sitss')).toBe(1);
  });
  it('counts insertions and deletions', () => {
    expect(levenshtein('sites', 'site')).toBe(1);
    expect(levenshtein('site', 'sites')).toBe(1);
  });

  const known = ['auth', 'sites', 'read', 'write', 'tools', 'snapshots'];
  it('suggests the closest command within distance 2', () => {
    expect(suggestCommand('sitss', known)).toBe('sites');
    expect(suggestCommand('toolz', known)).toBe('tools');
  });
  it('returns null when nothing is within distance 2', () => {
    expect(suggestCommand('xyzzy', known)).toBeNull();
  });
});

describe('renderWelcome', () => {
  it('contains the wordmark and all 11 commands', () => {
    const out = stripAnsi(renderWelcome({ email: 'mihai@respira.press' }));
    // Wordmark line marker
    expect(out).toContain('for WordPress');
    // Greeting
    expect(out).toContain('welcome, mihai@respira.press');
    expect(out).toContain("you're signed in.");
    // 11 commands per the prompt
    expect(out).toContain('respira sites connect <url>');
    expect(out).toContain('respira sites list');
    expect(out).toContain('respira tools list');
    expect(out).toContain('respira tools search <query>');
    expect(out).toContain('respira tools describe <tool>');
    expect(out).toContain('respira read structure <url>');
    expect(out).toContain('respira read design-system <url>');
    expect(out).toContain('respira docs');
    expect(out).toContain('respira --help');
    // Tool count read from the central constant
    expect(out).toContain(`browse the ${TOTAL_TOOLS}-tool catalog`);
    // Docs link
    expect(out).toContain('https://respira.press/cli/docs');
  });

  it('falls back to a minimal layout below 40 columns', () => {
    const original = process.stdout.columns;
    Object.defineProperty(process.stdout, 'columns', { value: 30, configurable: true });
    try {
      const out = stripAnsi(renderWelcome({ email: 'x@y.z' }));
      // Wordmark is dropped
      expect(out).not.toContain('for WordPress');
      // But commands are still present
      expect(out).toContain('respira sites list');
    } finally {
      Object.defineProperty(process.stdout, 'columns', { value: original, configurable: true });
    }
  });
});

describe('renderWelcomeShort', () => {
  it('returns a two-line message with the email and help hint', () => {
    const out = stripAnsi(renderWelcomeShort({ email: 'mihai@respira.press' }));
    const lines = out.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('signed in as mihai@respira.press');
    expect(lines[1]).toContain('respira --help for commands');
  });
});

describe('NO_COLOR support', () => {
  let originalNoColor: string | undefined;
  beforeEach(() => {
    originalNoColor = process.env.NO_COLOR;
    process.env.NO_COLOR = '1';
  });
  afterEach(() => {
    if (originalNoColor === undefined) delete process.env.NO_COLOR;
    else process.env.NO_COLOR = originalNoColor;
  });

  it('strips ANSI escape codes from formatSuccess', () => {
    const out = formatSuccess('connected');
    expect(out).not.toMatch(/\x1b\[/);
  });
  it('strips ANSI escape codes from formatError', () => {
    const out = formatError('failed', 'try again');
    expect(out).not.toMatch(/\x1b\[/);
  });
  it('strips ANSI from renderWelcome', () => {
    const out = renderWelcome({ email: 'a@b.c' });
    expect(out).not.toMatch(/\x1b\[/);
  });
});
