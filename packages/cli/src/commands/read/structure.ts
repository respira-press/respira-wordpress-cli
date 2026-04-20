import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

/**
 * Tool Chain Function for `respira read structure <url>`.
 * Anonymous, no prerequisites. Works on any public WordPress URL.
 */
export const readStructureFunction: ToolChainFunction<unknown> = {
  name: 'read.structure',
  description: 'detect page builders and sitemap on any public WordPress URL',
  domainTags: ['pages', 'read', 'public', 'anonymous'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { site, baseUrl } = input as { site: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl, anonymous: true });
    return client.read.structure(site);
  },
};

export default class ReadStructure extends BaseCommand {
  static override description = 'return the structure of any public WordPress site (no auth required)';
  static override args = { site: Args.string({ required: true, description: 'public site URL' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(ReadStructure);
    try {
      const structure = await this.runThroughCycle(
        readStructureFunction,
        { site: args.site, baseUrl: flags['base-url'] },
        { toolName: 'read structure', task: { site: args.site } },
      );
      this.out.json(structure);
    } catch (err) {
      this.handleError(err);
    }
  }
}
