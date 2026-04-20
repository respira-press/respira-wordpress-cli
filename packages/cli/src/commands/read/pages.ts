import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Page } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readPagesFunction: ToolChainFunction<Page[]> = {
  name: 'read.pages',
  description: 'list pages on a connected site',
  domainTags: ['pages', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, builder, status, limit, search, baseUrl } = input as {
      site: string;
      builder?: string;
      status?: string;
      limit?: number;
      search?: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.pages(site, { builder, status, limit, search });
  },
};

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
      const pages = await this.runThroughCycle(
        readPagesFunction,
        {
          site: args.site,
          builder: flags.builder,
          status: flags.status,
          limit: flags.limit,
          search: flags.search,
          baseUrl: flags['base-url'],
        },
        { toolName: 'read pages', task: { site: args.site } },
      );
      this.out.table(pages, ['id', 'title', 'slug', 'status', 'builder']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
