import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ToolsSearch extends BaseCommand {
  static override description = 'search the tool catalog';
  static override args = { query: Args.string({ required: true, description: 'search query' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args } = await this.parse(ToolsSearch);
    try {
      const tools = await this.client.tools.search(args.query);
      this.out.table(tools, ['name', 'category', 'description']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
