import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadDesignSystem extends BaseCommand {
  static override description = 'return the design system (colors, fonts, spacing) of any public WordPress site';
  static override args = { site: Args.string({ required: true, description: 'public site URL' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args } = await this.parse(ReadDesignSystem);
    try {
      const ds = await this.client.read.designSystem(args.site);
      this.out.json(ds);
    } catch (err) {
      this.handleError(err);
    }
  }
}
