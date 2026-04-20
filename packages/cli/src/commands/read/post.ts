import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readPostFunction: ToolChainFunction<unknown> = {
  name: 'read.post',
  description: 'read a single post from a connected site',
  domainTags: ['posts', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, post, baseUrl } = input as {
      site: string;
      post: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.post(site, post);
  },
};

export default class ReadPost extends BaseCommand {
  static override description = 'read a single post';
  static override args = {
    site: Args.string({ required: true }),
    post: Args.string({ required: true, description: 'post ID or slug' }),
  };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadPost);
    try {
      const post = await this.runThroughCycle(
        readPostFunction,
        { site: args.site, post: args.post, baseUrl: flags['base-url'] },
        { toolName: 'read post', task: { site: args.site, post: args.post } },
      );
      this.out.json(post);
    } catch (err) {
      this.handleError(err);
    }
  }
}
