import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const snapshotsShowFunction: ToolChainFunction<unknown> = {
  name: 'snapshots.show',
  description: 'show snapshot metadata',
  domainTags: ['snapshots', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { snapshot, baseUrl } = input as { snapshot: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.snapshots.show(snapshot);
  },
};

export default class SnapshotsShow extends BaseCommand {
  static override description = 'show snapshot metadata';
  static override args = { snapshot: Args.string({ required: true, description: 'snapshot ID' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(SnapshotsShow);
    try {
      const snap = await this.runThroughCycle(
        snapshotsShowFunction,
        { snapshot: args.snapshot, baseUrl: flags['base-url'] },
        { toolName: 'snapshots show', task: { snapshot: args.snapshot } },
      );
      this.out.json(snap);
    } catch (err) {
      this.handleError(err);
    }
  }
}
