import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadPage extends BaseCommand {
  static override description = 'read a page from a connected site';
  static override args = {
    site: Args.string({ required: true, description: 'site URL or ID' }),
    page: Args.string({ required: true, description: 'page ID or slug' }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    as: Flags.string({
      description: 'output format for the page body',
      options: ['builder', 'html', 'portable'],
      default: 'builder',
    }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadPage);
    try {
      const page = await this.client.read.page(args.site, args.page, {
        as: flags.as as 'builder' | 'html' | 'portable',
      });
      this.out.json(page);
    } catch (err) {
      this.handleError(err);
    }
  }
}
