import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadStructure extends BaseCommand {
  static override description = 'return the structure of any public WordPress site (no auth required)';
  static override args = { site: Args.string({ required: true, description: 'public site URL' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args } = await this.parse(ReadStructure);
    try {
      const structure = await this.client.read.structure(args.site);
      this.out.json(structure);
    } catch (err) {
      this.handleError(err);
    }
  }
}
