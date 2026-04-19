import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { BaseCommand } from '../../base.js';

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
    const input = {
      title: title!,
      type: flags.type,
      status: flags.status as 'draft' | 'published' | 'private',
      markdown,
    };
    if (flags['dry-run']) {
      this.out.info('dry run. post not created:');
      this.out.json({ site: args.site, input });
      return;
    }
    try {
      const post = await this.client.write.createPost(args.site, input);
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
