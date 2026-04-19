import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadPages extends BaseCommand {
  static override description = 'list pages on a connected site';
  static override args = { site: Args.string({ required: true, description: 'site URL or ID' }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    builder: Flags.string({ description: 'filter by builder' }),
    status: Flags.string({ description: 'filter by status' }),
    limit: Flags.integer({ description: 'maximum results', default: 100 }),
    search: Flags.string({ description: 'search term' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadPages);
    try {
      const pages = await this.client.read.pages(args.site, {
        builder: flags.builder,
        status: flags.status,
        limit: flags.limit,
        search: flags.search,
      });
      this.out.table(pages, ['id', 'title', 'slug', 'status', 'builder']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
