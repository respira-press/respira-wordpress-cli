import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SnapshotsList extends BaseCommand {
  static override description = 'list snapshots for a site';
  static override args = { site: Args.string({ required: true }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(SnapshotsList);
    try {
      const snaps = await this.client.snapshots.list(args.site);
      this.out.table(snaps, ['id', 'createdAt', 'trigger', 'description']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
