import { Flags } from '@oclif/core';
import { mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
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

- \`.claude/skills/respira-wordpress-cli/SKILL.md\` — the skill that tells Claude Code how to use the Respira CLI
- \`.claude/commands/\` — shortcut commands for common workflows

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

export default class InitClaudeCode extends BaseCommand {
  static override description = 'set up Claude Code to use the Respira CLI (creates .claude/ in cwd)';
  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({ description: 'overwrite existing files' }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { flags } = await this.parse(InitClaudeCode);
    const cwd = process.cwd();
    const skillDir = join(cwd, '.claude', 'skills', 'respira-wordpress-cli');
    const commandDir = join(cwd, '.claude', 'commands');

    await mkdir(skillDir, { recursive: true });
    await mkdir(commandDir, { recursive: true });

    await this.writeIfSafe(join(skillDir, 'SKILL.md'), SKILL_MD, flags.force);
    await this.writeIfSafe(join(commandDir, 'audit-wordpress.md'), COMMAND_AUDIT, flags.force);
    await this.writeIfSafe(join(commandDir, 'edit-wordpress-element.md'), COMMAND_EDIT, flags.force);
    await this.writeIfSafe(join(cwd, '.claude', 'RESPIRA_CLI_README.md'), README_MD, flags.force);

    this.out.success('Claude Code is now configured to use Respira CLI.');
    this.out.info('next: run \'respira auth login\' if you haven\'t already, then try \'respira sites list\'.');
  }

  private async writeIfSafe(path: string, content: string, force: boolean): Promise<void> {
    if (!force) {
      try {
        await stat(path);
        this.out.warn(`skipped (already exists): ${path}`);
        return;
      } catch {
        // file does not exist, proceed
      }
    }
    await writeFile(path, content, 'utf8');
    this.out.info(`wrote ${path}`);
  }
}
