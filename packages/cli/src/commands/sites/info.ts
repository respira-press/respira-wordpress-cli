import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SitesInfo extends BaseCommand {
  static override description = 'full metadata for one site';
  static override args = { site: Args.string({ required: true, description: 'site URL or ID' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(SitesInfo);
    try {
      const site = await this.client.sites.info(args.site);
      this.out.json(site);
    } catch (err) {
      this.handleError(err);
    }
  }
}
