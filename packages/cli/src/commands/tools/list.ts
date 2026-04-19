import { Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

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
      const tools = await this.client.tools.list({ for: flags.for });
      this.out.table(tools, ['name', 'category', 'description']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
