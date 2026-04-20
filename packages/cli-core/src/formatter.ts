/**
 * Respira CLI shared formatter — voice rules, color palette, glyphs.
 *
 * Every string the CLI prints to a user runs through this module. Rules:
 *   - Lowercase 'i' in first-person, no em dashes, no marketing jargon
 *   - Three glyphs only: ✓ (success), ✗ (error), ! (warning). No emojis.
 *   - Restrained color palette via picocolors. Auto-disable on NO_COLOR or non-TTY.
 *   - Consistent shape: <glyph> <fact>, optional indented remediation line.
 *
 * @since 0.1.4
 */

import pc from 'picocolors';
import { TOTAL_TOOLS } from './tool-count.js';

// ---- Color enablement ---------------------------------------------------

/**
 * Returns true if we should emit ANSI color codes. Honors NO_COLOR (per the
 * NO_COLOR spec at https://no-color.org/) and turns off automatically when
 * stdout is piped to another command or redirected to a file.
 */
export function colorEnabled(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.RESPIRA_NO_COLOR) return false;
  if (process.stdout && process.stdout.isTTY === false) return false;
  return true;
}

/** Wrap a string in a color, or return it bare if color is disabled. */
export function paint(text: string, fn: (s: string) => string): string {
  return colorEnabled() ? fn(text) : text;
}

// ---- Glyphs -------------------------------------------------------------

export const GLYPH = {
  check: '✓',
  cross: '✗',
  warn: '!',
} as const;

// ---- Atomic message builders -------------------------------------------

/**
 * Success: `✓ <message>` in dim green. No trailing period if the line is a
 * short fragment; the caller can include a period if it's a full sentence.
 *
 * @example formatSuccess('connected yoursite.com')
 */
export function formatSuccess(message: string): string {
  return `${paint(GLYPH.check, pc.green)} ${message}`;
}

/**
 * Error: `✗ <what went wrong>` followed by `  <remediation>` on the next
 * line. Errors must always include a remediation. The remediation is
 * indented two spaces under the cross.
 *
 * @example formatError('not signed in', 'run: respira auth login')
 */
export function formatError(message: string, remediation?: string): string {
  const line1 = `${paint(GLYPH.cross, pc.red)} ${message}`;
  if (!remediation) return line1;
  return `${line1}\n  ${paint(remediation, pc.dim)}`;
}

/**
 * Warning: `! <caution>` in yellow with an optional second-line note.
 *
 * @example formatWarning('about to run this on 47 sites', 'continue? (y/N)')
 */
export function formatWarning(message: string, detail?: string): string {
  const line1 = `${paint(GLYPH.warn, pc.yellow)} ${message}`;
  if (!detail) return line1;
  return `${line1}\n  ${paint(detail, pc.dim)}`;
}

/** A neutral progress note: `  <message>` in dim, indented. */
export function formatProgress(message: string): string {
  return `  ${paint(message, pc.dim)}`;
}

// ---- "Did you mean" command suggestions --------------------------------

/**
 * Levenshtein distance for typo suggestions on unknown commands.
 * Iterative DP, O(n*m), good enough for command names < 30 chars.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const prev: number[] = new Array(n + 1);
  const curr: number[] = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }
  return prev[n];
}

/**
 * Pick the closest command suggestion. Returns null if nothing within
 * distance 2.
 */
export function suggestCommand(input: string, knownCommands: string[]): string | null {
  let best: { cmd: string; dist: number } | null = null;
  for (const cmd of knownCommands) {
    const dist = levenshtein(input, cmd);
    if (dist <= 2 && (best === null || dist < best.dist)) {
      best = { cmd, dist };
    }
  }
  return best ? best.cmd : null;
}

// ---- Welcome screen ----------------------------------------------------

/**
 * The Respira ASCII wordmark. Four lines, Unicode box-drawing.
 * Falls back to plain text on terminals that can't render box-drawing.
 */
export const WORDMARK_BOX = [
  '  ┬─╮ ┌─┐ ┌─╮ ┬─╮ · ┬─╮ ┌─╮',
  '  │┬╯ ├─┤ ╰─╮ ├─╯ │ │┬╯ ├─┤',
  '  ┴╰─ └─┘ ╰─┘ ┴   ╵ ┴╰─ ┴ ┴',
  '            for WordPress',
];

export const WORDMARK_PLAIN = [
  '  respira',
  '  for WordPress',
];

/**
 * Best-effort detection of whether the terminal can render the box-drawing
 * wordmark. Defaults to true; only flips false on environments that
 * advertise themselves as ASCII-only.
 */
export function supportsBoxDrawing(): boolean {
  if (process.env.RESPIRA_PLAIN_WORDMARK) return false;
  // CI environments and basic dumb terminals often render box-drawing as ?
  if (process.env.TERM === 'dumb') return false;
  return true;
}

function renderWordmark(): string {
  const lines = supportsBoxDrawing() ? WORDMARK_BOX : WORDMARK_PLAIN;
  // The wordmark itself is not colored; the tittle (·) on line 1 could
  // optionally be tinted but per the prompt we skip that to keep it clean.
  return lines.map((l) => paint(l, pc.white)).join('\n');
}

interface WelcomeUser {
  email?: string | null;
}

/**
 * The full first-run welcome screen shown after `respira auth login` succeeds.
 * Adapts to terminal width (drops indentation on narrow terminals, drops
 * the wordmark entirely on very narrow terminals).
 */
export function renderWelcome(user: WelcomeUser): string {
  const email = user.email ?? 'respira user';
  const cols = (process.stdout && process.stdout.columns) || 80;

  const groups: Array<{ label: string; cmds: Array<{ cmd: string; desc: string }> }> = [
    {
      label: 'connect your sites',
      cmds: [
        { cmd: 'respira sites connect <url>', desc: 'connect a WordPress site' },
        { cmd: 'respira sites list', desc: 'see your connected sites' },
      ],
    },
    {
      label: 'explore the tools',
      cmds: [
        { cmd: 'respira tools list', desc: `browse the ${TOTAL_TOOLS}-tool catalog` },
        { cmd: 'respira tools search <query>', desc: 'find tools by name or purpose' },
        { cmd: 'respira tools describe <tool>', desc: "see a tool's full signature" },
      ],
    },
    {
      label: 'read any site',
      cmds: [
        { cmd: 'respira read structure <url>', desc: 'inspect any public WP site' },
        { cmd: 'respira read design-system <url>', desc: 'extract colors and fonts' },
      ],
    },
    {
      label: 'get help',
      cmds: [
        { cmd: 'respira docs', desc: 'browse documentation' },
        { cmd: 'respira --help', desc: 'see all commands' },
      ],
    },
  ];

  const lines: string[] = [];

  // Wordmark (only if terminal is wide enough)
  if (cols >= 40) {
    lines.push(renderWordmark());
    lines.push('');
  }

  lines.push(` ${paint(GLYPH.check, pc.green)} ${paint(`welcome, ${email}`, (s) => s)}`);
  lines.push(`   ${paint("you're signed in.", pc.dim)}`);
  lines.push('');
  lines.push(` ${paint('try one of these next', pc.dim)}`);
  lines.push('');

  // Find the longest command across all groups for soft alignment within group
  const renderGroup = (g: typeof groups[number], indent: string, cmdIndent: string) => {
    const longest = g.cmds.reduce((m, c) => Math.max(m, c.cmd.length), 0);
    lines.push(`${indent}${paint(g.label, (s) => pc.dim(pc.italic(s)))}`);
    for (const { cmd, desc } of g.cmds) {
      const padded = cmd.padEnd(longest, ' ');
      lines.push(`${cmdIndent}${paint(padded, (s) => s)}  ${paint(desc, pc.dim)}`);
    }
    lines.push('');
  };

  let groupIndent = '   ';
  let cmdIndent = '     ';
  if (cols < 60) {
    // Compact: drop group indentation, keep commands flush
    groupIndent = ' ';
    cmdIndent = '   ';
  }
  if (cols < 50) {
    // Very narrow: skip group labels entirely
    for (const g of groups) {
      const longest = g.cmds.reduce((m, c) => Math.max(m, c.cmd.length), 0);
      for (const { cmd, desc } of g.cmds) {
        const padded = cmd.padEnd(longest, ' ');
        lines.push(` ${paint(padded, (s) => s)}  ${paint(desc, pc.dim)}`);
      }
    }
  } else {
    for (const g of groups) renderGroup(g, groupIndent, cmdIndent);
  }

  lines.push(` ${paint('docs  ', pc.dim)}${paint('https://respira.press/cli/docs', (s) => pc.blue(pc.underline(s)))}`);
  return lines.join('\n');
}

/**
 * The short subsequent-run welcome shown by `respira auth whoami` and
 * other status-check commands. Two lines, no wordmark, no command grid.
 */
export function renderWelcomeShort(user: WelcomeUser): string {
  const email = user.email ?? 'respira user';
  return [
    ` ${paint(GLYPH.check, pc.green)} signed in as ${email}`,
    `   ${paint('respira --help for commands', pc.dim)}`,
  ].join('\n');
}
