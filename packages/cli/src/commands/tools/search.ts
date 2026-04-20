import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Tool } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const toolsSearchFunction: ToolChainFunction<Tool[]> = {
  name: 'tools.search',
  description: 'search the MCP tool catalog by keyword',
  domainTags: ['tools', 'read', 'anonymous'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { query, baseUrl } = input as { query: string; baseUrl?: string };
    const client = createRespiraClient({ baseUrl, anonymous: true });
    return client.tools.search(query);
  },
};

export default class ToolsSearch extends BaseCommand {
  static override description = 'search the tool catalog';
  static override args = { query: Args.string({ required: true, description: 'search query' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(ToolsSearch);
    try {
      const tools = await this.runThroughCycle(
        toolsSearchFunction,
        { query: args.query, baseUrl: flags['base-url'] },
        { toolName: 'tools search', task: { query: args.query } },
      );
      if (!tools.length) {
        this.log('');
        this.log(`  no tools found for "${args.query}"`);
        this.log('');
        this.log('  try a simpler query, for example:');
        this.log('    respira tools search builder');
        this.log('    respira tools search elementor');
        this.log('');
        this.log('  or browse the full catalog:');
        this.log('    respira tools list');
        this.log('');
        return;
      }
      this.out.table(tools, ['name', 'category', 'description']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
