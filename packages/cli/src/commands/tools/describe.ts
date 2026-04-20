import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const toolsDescribeFunction: ToolChainFunction<unknown> = {
  name: 'tools.describe',
  description: 'show the full schema for one MCP tool',
  domainTags: ['tools', 'docs', 'read', 'anonymous'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { tool, baseUrl } = input as { tool: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl, anonymous: true });
    return client.tools.describe(tool);
  },
};

export default class ToolsDescribe extends BaseCommand {
  static override description = 'show the full schema for one tool';
  static override args = { tool: Args.string({ required: true, description: 'tool name' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(ToolsDescribe);
    try {
      const tool = await this.runThroughCycle(
        toolsDescribeFunction,
        { tool: args.tool, baseUrl: flags['base-url'] },
        { toolName: 'tools describe', task: { tool: args.tool } },
      );
      this.out.json(tool);
    } catch (err) {
      this.handleError(err);
    }
  }
}
