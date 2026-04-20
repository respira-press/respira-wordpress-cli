import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Post } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

type CreatePostPayload = {
  title: string;
  type: string;
  status: 'draft' | 'published' | 'private';
  markdown?: string;
};

export const writeCreatePostFunction: ToolChainFunction<Post> = {
  name: 'write.create-post',
  description: 'create a post, optionally from a Markdown file',
  domainTags: ['posts', 'write', 'connected', 'licensed'],
  capability: 'write',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { site, payload, baseUrl } = input as {
      site: string;
      payload: CreatePostPayload;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.write.createPost(site, payload);
  },
};

export default class WriteCreatePost extends BaseCommand {
  static override description = 'create a post, optionally from a Markdown file';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    title: Flags.string({ description: 'post title (optional if --from-markdown has frontmatter)' }),
    'from-markdown': Flags.string({ description: 'path to a Markdown file' }),
    type: Flags.string({ default: 'post' }),
    status: Flags.string({ options: ['draft', 'published', 'private'], default: 'draft' }),
    'dry-run': Flags.boolean(),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteCreatePost);
    const markdown = flags['from-markdown'] ? await readFile(flags['from-markdown'], 'utf8') : undefined;
    const title = flags.title ?? (markdown ? extractMarkdownTitle(markdown) : undefined);
    if (!title) {
      this.out.error('--title is required unless --from-markdown has a first H1 or frontmatter title');
      this.exit(2);
    }
    const payload: CreatePostPayload = {
      title: title!,
      type: flags.type,
      status: flags.status as 'draft' | 'published' | 'private',
      markdown,
    };
    if (flags['dry-run']) {
      this.out.info('dry run. post not created:');
      this.out.json({ site: args.site, input: payload });
      return;
    }
    try {
      const post = await this.runThroughCycle(
        writeCreatePostFunction,
        { site: args.site, payload, baseUrl: flags['base-url'] },
        { toolName: 'write create-post', task: { site: args.site } },
      );
      this.out.json(post);
    } catch (err) {
      this.handleError(err);
    }
  }
}

function extractMarkdownTitle(md: string): string | undefined {
  const fm = md.match(/^---\s*[\s\S]*?title:\s*"?([^"\n]+)"?\s*[\s\S]*?---/);
  if (fm) return fm[1]?.trim();
  const h1 = md.match(/^#\s+(.+)$/m);
  return h1?.[1]?.trim();
}
