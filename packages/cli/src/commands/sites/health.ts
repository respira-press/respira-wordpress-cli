import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const sitesHealthFunction: ToolChainFunction<unknown> = {
  name: 'sites.health',
  description: 'run a health check on a connected site',
  domainTags: ['sites', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, baseUrl } = input as { site: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.sites.health(site);
  },
};

export default class SitesHealth extends BaseCommand {
  static override description = 'run a health check on a connected site';
  static override args = { site: Args.string({ required: true, description: 'site URL or ID' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(SitesHealth);
    try {
      const report = await this.runThroughCycle(
        sitesHealthFunction,
        { site: args.site, baseUrl: flags['base-url'] },
        { toolName: 'sites health', task: { site: args.site } },
      );
      this.out.json(report);
    } catch (err) {
      this.handleError(err);
    }
  }
}
