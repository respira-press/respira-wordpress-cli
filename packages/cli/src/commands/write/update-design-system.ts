import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type DesignSystem, type DesignSystemInput } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const writeUpdateDesignSystemFunction: ToolChainFunction<DesignSystem> = {
  name: 'write.update-design-system',
  description: 'update site-wide colors, fonts, and spacing',
  domainTags: ['design-system', 'write', 'connected', 'licensed'],
  capability: 'write',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { site, payload, baseUrl } = input as {
      site: string;
      payload: DesignSystemInput;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.write.updateDesignSystem(site, payload);
  },
};

export default class WriteUpdateDesignSystem extends BaseCommand {
  static override description = 'update site-wide colors, fonts, and spacing';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    from: Flags.string({ required: true, description: 'path to a JSON file with colors/fonts/spacing' }),
    'dry-run': Flags.boolean(),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteUpdateDesignSystem);
    const payload = JSON.parse(await readFile(flags.from, 'utf8'));
    if (flags['dry-run']) {
      this.out.info('dry run. design system not updated:');
      this.out.json({ site: args.site, input: payload });
      return;
    }
    try {
      const ds = await this.runThroughCycle(
        writeUpdateDesignSystemFunction,
        { site: args.site, payload, baseUrl: flags['base-url'] },
        { toolName: 'write update-design-system', task: { site: args.site } },
      );
      this.out.json(ds);
    } catch (err) {
      this.handleError(err);
    }
  }
}
