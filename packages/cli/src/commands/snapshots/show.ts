import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SnapshotsShow extends BaseCommand {
  static override description = 'show snapshot metadata';
  static override args = { snapshot: Args.string({ required: true, description: 'snapshot ID' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(SnapshotsShow);
    try {
      const snap = await this.client.snapshots.show(args.snapshot);
      this.out.json(snap);
    } catch (err) {
      this.handleError(err);
    }
  }
}
