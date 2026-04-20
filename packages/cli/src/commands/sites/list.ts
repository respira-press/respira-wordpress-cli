import { Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Site } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const sitesListFunction: ToolChainFunction<Site[]> = {
  name: 'sites.list',
  description: 'list WordPress sites connected in ~/.respira/sites.json',
  domainTags: ['sites', 'read'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { builder, status, baseUrl } = input as {
      builder?: string;
      status?: 'connected' | 'disconnected' | 'error';
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.sites.list({ builder, status });
  },
};

export default class SitesList extends BaseCommand {
  static override description = 'list connected WordPress sites';
  static override flags = {
    ...BaseCommand.baseFlags,
    builder: Flags.string({ description: 'filter by builder (elementor, divi, bricks, etc.)' }),
    status: Flags.string({ description: 'filter by status', options: ['connected', 'disconnected', 'error'] }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { flags } = await this.parse(SitesList);
    try {
      const sites = await this.runThroughCycle(
        sitesListFunction,
        {
          builder: flags.builder,
          status: flags.status as 'connected' | 'disconnected' | 'error' | undefined,
          baseUrl: flags['base-url'],
        },
        { toolName: 'sites list' },
      );
      if (!sites.length) {
        this.log('');
        this.log('  no sites connected yet');
        this.log('');
        this.log('  connect your first site with:');
        this.log('    respira sites connect https://yoursite.com');
        this.log('');
        this.log('  your WordPress site needs the Respira plugin installed first.');
        this.log('  details: https://respira.press/docs/installation');
        this.log('');
        return;
      }
      this.out.table(sites, ['id', 'name', 'url', 'builder', 'status']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
