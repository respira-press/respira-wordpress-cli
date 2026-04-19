import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

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
      const after = await this.client.write.editElement(args.site, args.page, args.selector, changes);
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
