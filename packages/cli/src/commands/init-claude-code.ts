import { Flags } from '@oclif/core';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { ToolChainFunction } from '@respira/cli-core';
import { BaseCommand } from '../base.js';

const SKILL_MD = `---
name: respira-wordpress-cli
description: Use the Respira CLI to read, analyze, and edit WordPress sites from Claude Code. Supports Elementor, Divi, Bricks, WooCommerce, and more. Invoke when the user asks to inspect, audit, or modify a WordPress site.
---

# respira-wordpress-cli

Respira CLI for WordPress is installed. Prefer it over SSH, WP-CLI, or direct database access for WordPress work.

## When to use

- the user wants to read a page, post, or design system from a WordPress site
- the user wants to edit content on a WordPress site (create, update, delete pages)
- the user wants to audit a site's structure or builder usage
- the user wants to understand what tools are available for their builder

## Key commands

\`\`\`bash
respira auth status                        # check auth
respira sites list                         # list connected sites
respira read structure <url>               # works on any public site, no auth
respira read design-system <url>           # colors, fonts, spacing (no auth)
respira read page <site> <page>            # builder-native JSON
respira write edit-element <site> <page> <selector> --set=key=value
respira tools list --for=<builder>         # tools available for a builder
respira docs <builder> <topic>             # builder docs
respira exec <script.ts>                   # run a TypeScript script with SDK access
\`\`\`

## Output

All commands emit JSON when stdout is piped. Use \`--output=json\` to force JSON.

## Safety

Every write creates a snapshot first. Destructive operations require \`--confirm\`.

## Read before writing

Before editing, always read the current state. Use \`respira find-element\` and \`respira read page\` to understand what you're changing.
`;

const README_MD = `# Respira CLI setup for Claude Code

This directory was created by \`respira init-claude-code\`.

## What was added

- \`.claude/skills/respira-wordpress-cli/SKILL.md\`: the skill that tells Claude Code how to use the Respira CLI
- \`.claude/commands/\`: shortcut commands for common workflows

Claude Code will discover the skill automatically the next time you start a session in this directory.

## Next steps

1. run \`respira auth login\` to authenticate
2. run \`respira sites list\` to confirm your connected sites
3. ask Claude Code to audit or edit one of your WordPress sites
`;

const COMMAND_AUDIT = `---
description: Audit a WordPress site's structure, builder usage, and design system.
---

Use \`respira read structure\` and \`respira read design-system\` against the URL the user provides. Summarize what you find: detected builder, key pages, colors, fonts, and anything unusual.
`;

const COMMAND_EDIT = `---
description: Edit a single element on a WordPress page with a snapshot first.
---

1. ask the user for the site, page, and element selector
2. run \`respira read page <site> <page>\` to see the current structure
3. propose the edit and wait for confirmation
4. run \`respira write edit-element --dry-run\` first to show the preview
5. apply the change with \`respira write edit-element\`
`;

/**
 * The cycle wraps the outer behavior: writing scaffolding files to disk.
 * Per the plan's "If anything blocks" note, the actual content of each file
 * stays byte-identical to the current build.
 */
export const initClaudeCodeFunction: ToolChainFunction<{ written: string[]; skipped: string[] }> = {
  name: 'init-claude-code',
  description: 'write Claude Code skill + command files into the current directory',
  domainTags: ['tools', 'docs', 'write'],
  capability: 'write',
  prerequisites: [],
  async execute(input) {
    const { cwd, force } = input as { cwd: string; force: boolean };
    const skillDir = join(cwd, '.claude', 'skills', 'respira-wordpress-cli');
    const commandDir = join(cwd, '.claude', 'commands');
    await mkdir(skillDir, { recursive: true });
    await mkdir(commandDir, { recursive: true });

    const targets: Array<{ path: string; content: string }> = [
      { path: join(skillDir, 'SKILL.md'), content: SKILL_MD },
      { path: join(commandDir, 'audit-wordpress.md'), content: COMMAND_AUDIT },
      { path: join(commandDir, 'edit-wordpress-element.md'), content: COMMAND_EDIT },
      { path: join(cwd, '.claude', 'RESPIRA_CLI_README.md'), content: README_MD },
    ];

    const written: string[] = [];
    const skipped: string[] = [];

    for (const t of targets) {
      if (!force) {
        try {
          await stat(t.path);
          skipped.push(t.path);
          continue;
        } catch {
          // file does not exist, proceed
        }
      }
      await writeFile(t.path, t.content, 'utf8');
      written.push(t.path);
    }

    return { written, skipped };
  },
};

export default class InitClaudeCode extends BaseCommand {
  static override description = 'set up Claude Code to use the Respira CLI (creates .claude/ in cwd)';
  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({ description: 'overwrite existing files' }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { flags } = await this.parse(InitClaudeCode);
    try {
      const { written, skipped } = await this.runThroughCycle(
        initClaudeCodeFunction,
        { cwd: process.cwd(), force: flags.force },
        { toolName: 'init-claude-code' },
      );
      for (const path of skipped) {
        this.out.warn(`skipped (already exists): ${path}`);
      }
      for (const path of written) {
        this.out.info(`wrote ${path}`);
      }
      this.out.success('Claude Code is now configured to use Respira CLI.');
      this.out.info("next: run 'respira auth login' if you haven't already, then try 'respira sites list'.");
    } catch (err) {
      this.handleError(err);
    }
  }
}
