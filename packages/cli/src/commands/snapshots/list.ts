import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

type Snapshot = { id: string; createdAt: string; trigger?: string; description?: string };

export const snapshotsListFunction: ToolChainFunction<Snapshot[]> = {
  name: 'snapshots.list',
  description: 'list snapshots for a connected site',
  domainTags: ['snapshots', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, baseUrl } = input as { site: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.snapshots.list(site) as Promise<Snapshot[]>;
  },
};

export default class SnapshotsList extends BaseCommand {
  static override description = 'list snapshots for a site';
  static override args = { site: Args.string({ required: true }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(SnapshotsList);
    try {
      const snaps = await this.runThroughCycle(
        snapshotsListFunction,
        { site: args.site, baseUrl: flags['base-url'] },
        { toolName: 'snapshots list', task: { site: args.site } },
      );
      if (!snaps.length) {
        this.log('');
        this.log(`  no snapshots yet for ${args.site}`);
        this.log('');
        this.log('  snapshots are created automatically whenever you write through Respira.');
        this.log('  make your first edit with any connected AI tool and snapshots will appear here.');
        this.log('');
        return;
      }
      this.out.table(snaps, ['id', 'createdAt', 'trigger', 'description']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
