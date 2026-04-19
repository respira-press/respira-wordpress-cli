import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { BaseCommand } from '../../base.js';

export default class WriteCreatePage extends BaseCommand {
  static override description = 'create a new page on a connected site';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ required: true, description: 'page title' }),
    slug: Flags.string({ description: 'URL slug' }),
    status: Flags.string({ options: ['draft', 'published', 'private'], default: 'draft' }),
    template: Flags.string({ description: 'path to a JSON template file' }),
    'dry-run': Flags.boolean({ description: 'preview without making changes' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteCreatePage);
    const content = flags.template ? JSON.parse(await readFile(flags.template, 'utf8')) : undefined;
    const input = {
      title: flags.title,
      slug: flags.slug,
      status: flags.status as 'draft' | 'published' | 'private',
      content,
    };
    if (flags['dry-run']) {
      this.out.info('dry run. request not sent:');
      this.out.json({ site: args.site, input });
      return;
    }
    try {
      const page = await this.client.write.createPage(args.site, input);
      this.out.json(page);
    } catch (err) {
      this.handleError(err);
    }
  }
}
