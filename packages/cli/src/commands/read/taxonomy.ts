import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Term } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readTaxonomyFunction: ToolChainFunction<Term[]> = {
  name: 'read.taxonomy',
  description: 'list terms for a taxonomy (category, post_tag, etc.)',
  domainTags: ['taxonomy', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, taxonomy, baseUrl } = input as {
      site: string;
      taxonomy: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.taxonomy(site, taxonomy);
  },
};

export default class ReadTaxonomy extends BaseCommand {
  static override description = 'list terms for a taxonomy (category, post_tag, etc.)';
  static override args = {
    site: Args.string({ required: true }),
    taxonomy: Args.string({ required: true, description: 'taxonomy name' }),
  };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadTaxonomy);
    try {
      const terms = await this.runThroughCycle(
        readTaxonomyFunction,
        { site: args.site, taxonomy: args.taxonomy, baseUrl: flags['base-url'] },
        { toolName: 'read taxonomy', task: { site: args.site, taxonomy: args.taxonomy } },
      );
      this.out.table(terms, ['id', 'name', 'slug', 'count']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
