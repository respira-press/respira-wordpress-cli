import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const writeEditElementFunction: ToolChainFunction<unknown> = {
  name: 'write.edit-element',
  description: 'update one element on a page (duplicate-first)',
  domainTags: ['pages', 'write', 'connected', 'licensed'],
  capability: 'write',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { site, page, selector, changes, baseUrl } = input as {
      site: string;
      page: string;
      selector: string;
      changes: Record<string, unknown>;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.write.editElement(site, page, selector, changes);
  },
};

export default class WriteEditElement extends BaseCommand {
  static override description = 'update one element on a page';
  static override args = {
    site: Args.string({ required: true }),
    page: Args.string({ required: true }),
    selector: Args.string({ required: true, description: 'element selector (id, CSS, or widget type)' }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    set: Flags.string({ required: true, multiple: true, description: 'key=value (repeatable)' }),
    'dry-run': Flags.boolean(),
    diff: Flags.boolean({ description: 'show before/after by reading the page first' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteEditElement);
    const changes: Record<string, unknown> = {};
    for (const pair of flags.set as string[]) {
      const idx = pair.indexOf('=');
      if (idx < 0) throw new Error(`--set expects key=value, got: ${pair}`);
      const key = pair.slice(0, idx);
      const raw = pair.slice(idx + 1);
      let value: unknown = raw;
      try {
        value = JSON.parse(raw);
      } catch {
        // keep as string
      }
      changes[key] = value;
    }
    if (flags['dry-run']) {
      this.out.info('dry run. element not modified:');
      this.out.json({ site: args.site, page: args.page, selector: args.selector, changes });
      return;
    }
    try {
      const before = flags.diff
        ? await this.client.read.page(args.site, args.page).catch(() => null)
        : null;
      const after = await this.runThroughCycle(
        writeEditElementFunction,
        { site: args.site, page: args.page, selector: args.selector, changes, baseUrl: flags['base-url'] },
        { toolName: 'write edit-element', task: { site: args.site, page: args.page } },
      );
      if (flags.diff) {
        this.out.json({ before, after });
      } else {
        this.out.json(after);
      }
    } catch (err) {
      this.handleError(err);
    }
  }
}
