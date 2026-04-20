import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const snapshotsRestoreFunction: ToolChainFunction<unknown> = {
  name: 'snapshots.restore',
  description: 'restore a snapshot (destructive, overwrites current state)',
  domainTags: ['snapshots', 'write', 'destructive', 'connected', 'licensed'],
  capability: 'destructive',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { snapshot, baseUrl } = input as { snapshot: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.snapshots.restore(snapshot);
  },
};

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
      this.out.error('--confirm is required to restore\n  add --confirm to overwrite the current page state');
      this.exit(2);
    }
    try {
      await this.runThroughCycle(
        snapshotsRestoreFunction,
        { snapshot: args.snapshot, baseUrl: flags['base-url'] },
        { toolName: 'snapshots restore', task: { snapshot: args.snapshot } },
      );
      this.out.success(`restored snapshot ${args.snapshot}`);
    } catch (err) {
      this.handleError(err);
    }
  }
}
