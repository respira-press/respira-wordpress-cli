import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadPosts extends BaseCommand {
  static override description = 'list posts on a connected site';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'post type (post, product, etc.)' }),
    limit: Flags.integer({ description: 'maximum results', default: 50 }),
    search: Flags.string({ description: 'search term' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadPosts);
    try {
      const posts = await this.client.read.posts(args.site, {
        type: flags.type,
        limit: flags.limit,
        search: flags.search,
      });
      this.out.table(posts, ['id', 'title', 'slug', 'status', 'type']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
