import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class WriteEditPage extends BaseCommand {
  static override description = 'edit a page using JSON path patches';
  static override strict = false;
  static override args = {
    site: Args.string({ required: true }),
    page: Args.string({ required: true }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    set: Flags.string({
      description: 'path=value to set (repeatable)',
      multiple: true,
      required: true,
    }),
    'dry-run': Flags.boolean({ description: 'preview without making changes' }),
    diff: Flags.boolean({ description: 'show before/after by reading the page first' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteEditPage);
    const patches = (flags.set as string[]).map((pair) => {
      const idx = pair.indexOf('=');
      if (idx < 0) throw new Error(`--set expects path=value, got: ${pair}`);
      const path = pair.slice(0, idx);
      const raw = pair.slice(idx + 1);
      let value: unknown = raw;
      try {
        value = JSON.parse(raw);
      } catch {
        // keep as string
      }
      return { op: 'set' as const, path, value };
    });
    if (flags['dry-run']) {
      this.out.info('dry run. patches not applied:');
      this.out.json({ site: args.site, page: args.page, patches });
      return;
    }
    try {
      const before = flags.diff
        ? await this.client.read.page(args.site, args.page).catch(() => null)
        : null;
      const after = await this.client.write.editPage(args.site, args.page, patches);
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
