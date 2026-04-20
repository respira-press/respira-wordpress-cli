import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Post } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readPostsFunction: ToolChainFunction<Post[]> = {
  name: 'read.posts',
  description: 'list posts on a connected site',
  domainTags: ['posts', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, type, limit, search, baseUrl } = input as {
      site: string;
      type?: string;
      limit?: number;
      search?: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.posts(site, { type, limit, search });
  },
};

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
      const posts = await this.runThroughCycle(
        readPostsFunction,
        {
          site: args.site,
          type: flags.type,
          limit: flags.limit,
          search: flags.search,
          baseUrl: flags['base-url'],
        },
        { toolName: 'read posts', task: { site: args.site } },
      );
      this.out.table(posts, ['id', 'title', 'slug', 'status', 'type']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
