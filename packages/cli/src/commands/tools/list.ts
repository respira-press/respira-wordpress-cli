import { Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Tool } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const toolsListFunction: ToolChainFunction<Tool[]> = {
  name: 'tools.list',
  description: 'list the full Respira MCP tool catalog with optional filter',
  domainTags: ['tools', 'read', 'anonymous'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { for: forKey, baseUrl } = input as { for?: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl, anonymous: true });
    return client.tools.list({ for: forKey });
  },
};

export default class ToolsList extends BaseCommand {
  static override description = 'list Respira tools';
  static override flags = {
    ...BaseCommand.baseFlags,
    for: Flags.string({
      description: 'filter by a contextual key (e.g. elementor, task:content-editing, site:mysite.com)',
    }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { flags } = await this.parse(ToolsList);
    try {
      const tools = await this.runThroughCycle(
        toolsListFunction,
        { for: flags.for, baseUrl: flags['base-url'] },
        { toolName: 'tools list', task: { for: flags.for ?? null } },
      );
      this.out.table(tools, ['name', 'category', 'description']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
