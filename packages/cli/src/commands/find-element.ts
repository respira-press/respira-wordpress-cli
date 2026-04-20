import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../base.js';

type FindElementQuery = {
  type?: string;
  text?: string;
  css?: string;
  id?: string;
  limit?: number;
};

export const findElementFunction: ToolChainFunction<
  Array<{ id: string; type: string; text: string; path: string }>
> = {
  name: 'find-element',
  description: 'find elements on a page by type, text, CSS class, or id',
  domainTags: ['pages', 'read', 'connected'],
  capability: 'read',
  prerequisites: [{ type: 'site_connected', required: true }],
  async execute(input) {
    const { site, page, query, baseUrl } = input as {
      site: string;
      page: string;
      query: FindElementQuery;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.read.findElement(site, page, query) as Promise<
      Array<{ id: string; type: string; text: string; path: string }>
    >;
  },
};

export default class FindElement extends BaseCommand {
  static override description = 'find elements on a page by type, text, CSS class, or id';

  static override examples = [
    '<%= config.bin %> find-element mysite.com about heading --text="welcome"',
    '<%= config.bin %> find-element mysite.com home et_pb_text --text="welcome"',
    '<%= config.bin %> find-element mysite.com home --type=heading --limit=10',
    '<%= config.bin %> find-element mysite.com contact --css=".cta-button"',
  ];

  static override args = {
    site: Args.string({ required: true, description: 'site URL or ID' }),
    page: Args.string({ required: true, description: 'page ID or slug' }),
    type: Args.string({ description: 'element type or widget name (optional when using --css, --text, --id)' }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ description: 'element type (e.g. heading, et_pb_text, brxe-heading)' }),
    text: Flags.string({ description: 'match by inner text' }),
    css: Flags.string({ description: 'match by CSS selector / class' }),
    id: Flags.string({ description: 'match by element id' }),
    limit: Flags.integer({ description: 'maximum results', default: 50 }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(FindElement);
    const query: FindElementQuery = {
      type: flags.type ?? args.type,
      text: flags.text,
      css: flags.css,
      id: flags.id,
      limit: flags.limit,
    };
    if (!query.type && !query.text && !query.css && !query.id) {
      this.out.error('at least one of <type>, --type, --text, --css, or --id is required');
      this.exit(2);
    }
    try {
      const results = await this.runThroughCycle(
        findElementFunction,
        { site: args.site, page: args.page, query, baseUrl: flags['base-url'] },
        { toolName: 'find-element', task: { site: args.site, page: args.page } },
      );
      this.out.table(results, ['id', 'type', 'text', 'path']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
