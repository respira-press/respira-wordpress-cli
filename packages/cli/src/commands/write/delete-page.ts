import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const writeDeletePageFunction: ToolChainFunction<unknown> = {
  name: 'write.delete-page',
  description: 'delete a page (destructive, irreversible)',
  domainTags: ['pages', 'write', 'destructive', 'connected', 'licensed'],
  capability: 'destructive',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { site, page, baseUrl } = input as {
      site: string;
      page: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.write.deletePage(site, page, { confirm: true });
  },
};

export default class WriteDeletePage extends BaseCommand {
  static override description = 'delete a page (destructive, requires --confirm)';
  static override args = {
    site: Args.string({ required: true }),
    page: Args.string({ required: true }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    confirm: Flags.boolean({ required: true, description: 'required to execute the delete' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteDeletePage);
    if (!flags.confirm) {
      this.out.error('--confirm is required to delete');
      this.exit(2);
    }
    try {
      await this.runThroughCycle(
        writeDeletePageFunction,
        { site: args.site, page: args.page, baseUrl: flags['base-url'] },
        { toolName: 'write delete-page', task: { site: args.site, page: args.page } },
      );
      this.out.success(`deleted ${args.page}`);
    } catch (err) {
      this.handleError(err);
    }
  }
}
