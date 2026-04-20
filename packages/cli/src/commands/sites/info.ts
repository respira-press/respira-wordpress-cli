import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Site } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const sitesInfoFunction: ToolChainFunction<Site> = {
  name: 'sites.info',
  description: 'full metadata for one connected site',
  domainTags: ['sites', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, baseUrl } = input as { site: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.sites.info(site);
  },
};

export default class SitesInfo extends BaseCommand {
  static override description = 'full metadata for one site';
  static override args = { site: Args.string({ required: true, description: 'site URL or ID' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(SitesInfo);
    try {
      const site = await this.runThroughCycle(
        sitesInfoFunction,
        { site: args.site, baseUrl: flags['base-url'] },
        { toolName: 'sites info', task: { site: args.site } },
      );
      this.out.json(site);
    } catch (err) {
      this.handleError(err);
    }
  }
}
