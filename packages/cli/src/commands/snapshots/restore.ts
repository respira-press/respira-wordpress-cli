import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SnapshotsRestore extends BaseCommand {
  static override description = 'restore a snapshot';
  static override args = { snapshot: Args.string({ required: true, description: 'snapshot ID' }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    confirm: Flags.boolean({ required: true, description: 'required to execute restore' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(SnapshotsRestore);
    if (!flags.confirm) {
      this.out.error('--confirm is required to restore');
      this.exit(2);
    }
    try {
      await this.client.snapshots.restore(args.snapshot);
      this.out.success(`snapshot ${args.snapshot} restored`);
    } catch (err) {
      this.handleError(err);
    }
  }
}
