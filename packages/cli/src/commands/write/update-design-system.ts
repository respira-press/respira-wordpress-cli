import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { BaseCommand } from '../../base.js';

export default class WriteUpdateDesignSystem extends BaseCommand {
  static override description = 'update site-wide colors, fonts, and spacing';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({ required: true, description: 'path to a JSON file with colors/fonts/spacing' }),
    'dry-run': Flags.boolean(),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteUpdateDesignSystem);
    const input = JSON.parse(await readFile(flags.from, 'utf8'));
    if (flags['dry-run']) {
      this.out.info('dry run. design system not updated:');
      this.out.json({ site: args.site, input });
      return;
    }
    try {
      const ds = await this.client.write.updateDesignSystem(args.site, input);
      this.out.json(ds);
    } catch (err) {
      this.handleError(err);
    }
  }
}
