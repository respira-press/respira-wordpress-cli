import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadTaxonomy extends BaseCommand {
  static override description = 'list terms for a taxonomy (category, post_tag, etc.)';
  static override args = {
    site: Args.string({ required: true }),
    taxonomy: Args.string({ required: true, description: 'taxonomy name' }),
  };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(ReadTaxonomy);
    try {
      const terms = await this.client.read.taxonomy(args.site, args.taxonomy);
      this.out.table(terms, ['id', 'name', 'slug', 'count']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
