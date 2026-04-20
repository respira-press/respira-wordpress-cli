import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Page } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

type CreatePagePayload = {
  title: string;
  slug?: string;
  status: 'draft' | 'published' | 'private';
  content?: unknown;
};

export const writeCreatePageFunction: ToolChainFunction<Page> = {
  name: 'write.create-page',
  description: 'create a new page on a connected site',
  domainTags: ['pages', 'write', 'connected', 'licensed'],
  capability: 'write',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { site, payload, baseUrl } = input as {
      site: string;
      payload: CreatePagePayload;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.write.createPage(site, payload);
  },
};

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
    const payload: CreatePagePayload = {
      title: flags.title,
      slug: flags.slug,
      status: flags.status as 'draft' | 'published' | 'private',
      content,
    };
    if (flags['dry-run']) {
      this.out.info('dry run. request not sent:');
      this.out.json({ site: args.site, input: payload });
      return;
    }
    try {
      const page = await this.runThroughCycle(
        writeCreatePageFunction,
        { site: args.site, payload, baseUrl: flags['base-url'] },
        { toolName: 'write create-page', task: { site: args.site } },
      );
      this.out.json(page);
    } catch (err) {
      this.handleError(err);
    }
  }
}
