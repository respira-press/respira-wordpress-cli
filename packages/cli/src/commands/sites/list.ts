import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

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
      const sites = await this.client.sites.list({
        builder: flags.builder,
        status: flags.status as 'connected' | 'disconnected' | 'error' | undefined,
      });
      this.out.table(sites, ['id', 'name', 'url', 'builder', 'status']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
