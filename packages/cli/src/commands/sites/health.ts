import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SitesHealth extends BaseCommand {
  static override description = 'run a health check on a connected site';
  static override args = { site: Args.string({ required: true, description: 'site URL or ID' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(SitesHealth);
    try {
      const report = await this.client.sites.health(args.site);
      this.out.json(report);
    } catch (err) {
      this.handleError(err);
    }
  }
}
