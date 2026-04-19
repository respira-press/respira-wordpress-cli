import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ToolsDescribe extends BaseCommand {
  static override description = 'show the full schema for one tool';
  static override args = { tool: Args.string({ required: true, description: 'tool name' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args } = await this.parse(ToolsDescribe);
    try {
      const tool = await this.client.tools.describe(args.tool);
      this.out.json(tool);
    } catch (err) {
      this.handleError(err);
    }
  }
}
