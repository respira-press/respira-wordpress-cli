import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const readDesignSystemFunction: ToolChainFunction<unknown> = {
  name: 'read.design-system',
  description: 'extract colors, fonts, and spacing from any public WordPress site',
  domainTags: ['design-system', 'read', 'public', 'anonymous'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { site, baseUrl } = input as { site: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl, anonymous: true });
    return client.read.designSystem(site);
  },
};

export default class ReadDesignSystem extends BaseCommand {
  static override description = 'return the design system (colors, fonts, spacing) of any public WordPress site';
  static override args = { site: Args.string({ required: true, description: 'public site URL' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(ReadDesignSystem);
    try {
      const ds = await this.runThroughCycle(
        readDesignSystemFunction,
        { site: args.site, baseUrl: flags['base-url'] },
        { toolName: 'read design-system', task: { site: args.site } },
      );
      this.out.json(ds);
    } catch (err) {
      this.handleError(err);
    }
  }
}
