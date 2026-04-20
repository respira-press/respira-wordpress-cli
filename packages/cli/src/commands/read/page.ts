import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readPageFunction: ToolChainFunction<unknown> = {
  name: 'read.page',
  description: 'read a page from a connected site',
  domainTags: ['pages', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, page, as, baseUrl } = input as {
      site: string;
      page: string;
      as: 'builder' | 'html' | 'portable';
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.page(site, page, { as });
  },
};

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
      const page = await this.runThroughCycle(
        readPageFunction,
        {
          site: args.site,
          page: args.page,
          as: flags.as as 'builder' | 'html' | 'portable',
          baseUrl: flags['base-url'],
        },
        { toolName: 'read page', task: { site: args.site, page: args.page } },
      );
      this.out.json(page);
    } catch (err) {
      this.handleError(err);
    }
  }
}
