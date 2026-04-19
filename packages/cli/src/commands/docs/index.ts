import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { BaseCommand } from '../../base.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default class DocsTopic extends BaseCommand {
  static override description = 'read documentation for a topic (e.g. elementor widget-typography)';
  static override strict = false;
  static override args = {
    builder: Args.string({ required: true, description: 'builder or category (elementor, divi, bricks)' }),
    topic: Args.string({ description: 'topic name' }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    search: Flags.string({ description: 'full-text search across docs' }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(DocsTopic);
    if (flags.search) {
      try {
        const results = await this.client.docs.search(flags.search);
        this.out.table(results, ['topic', 'title']);
        return;
      } catch (err) {
        this.handleError(err);
      }
    }

    const local = await this.readEmbeddedDoc(args.builder, args.topic);
    if (local) {
      this.out.info(local);
      return;
    }
    const topicKey = args.topic ? `${args.builder}/${args.topic}` : args.builder;
    try {
      const doc = await this.client.docs.get(topicKey);
      this.out.info(`# ${doc.title}\n\n${doc.content}`);
    } catch (err) {
      this.handleError(err);
    }
  }

  private async readEmbeddedDoc(builder: string, topic?: string): Promise<string | null> {
    const candidates = [
      resolve(__dirname, '..', '..', '..', 'docs-content', builder, `${topic ?? 'index'}.md`),
      resolve(__dirname, '..', '..', 'docs-content', builder, `${topic ?? 'index'}.md`),
    ];
    for (const p of candidates) {
      try {
        return await readFile(p, 'utf8');
      } catch {
        // try next
      }
    }
    return null;
  }
}
