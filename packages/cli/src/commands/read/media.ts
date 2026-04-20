import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Media } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readMediaFunction: ToolChainFunction<Media[]> = {
  name: 'read.media',
  description: 'list media items on a connected site',
  domainTags: ['media', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, type, limit, baseUrl } = input as {
      site: string;
      type?: 'image' | 'video' | 'audio' | 'document';
      limit?: number;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.media(site, { type, limit });
  },
};

export default class ReadMedia extends BaseCommand {
  static override description = 'list media items';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ options: ['image', 'video', 'audio', 'document'] }),
    limit: Flags.integer({ default: 50 }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadMedia);
    try {
      const media = await this.runThroughCycle(
        readMediaFunction,
        {
          site: args.site,
          type: flags.type as 'image' | 'video' | 'audio' | 'document' | undefined,
          limit: flags.limit,
          baseUrl: flags['base-url'],
        },
        { toolName: 'read media', task: { site: args.site } },
      );
      this.out.table(media, ['id', 'filename', 'mimeType', 'url']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
