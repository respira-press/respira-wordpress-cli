import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type DocsOutput =
  | { kind: 'local'; content: string }
  | { kind: 'search'; results: Array<{ topic: string; title: string }> }
  | { kind: 'topic'; title: string; content: string };

export const docsFunction: ToolChainFunction<DocsOutput> = {
  name: 'docs.get',
  description: 'read documentation for a topic or search the catalog',
  domainTags: ['docs', 'read', 'anonymous'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { builder, topic, search, localFirst, baseUrl } = input as {
      builder: string;
      topic?: string;
      search?: string;
      localFirst: boolean;
      baseUrl?: string;
    };

    if (search) {
      const client = createRespiraClient({ baseUrl, anonymous: true });
      const results = (await client.docs.search(search)) as Array<{ topic: string; title: string }>;
      return { kind: 'search', results };
    }

    if (localFirst) {
      const local = await readEmbeddedDoc(builder, topic);
      if (local) return { kind: 'local', content: local };
    }

    const topicKey = topic ? `${builder}/${topic}` : builder;
    const client = createRespiraClient({ baseUrl, anonymous: true });
    const doc = await client.docs.get(topicKey);
    return { kind: 'topic', title: doc.title, content: doc.content };
  },
};

async function readEmbeddedDoc(builder: string, topic?: string): Promise<string | null> {
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
    try {
      const result = await this.runThroughCycle(
        docsFunction,
        {
          builder: args.builder,
          topic: args.topic,
          search: flags.search,
          localFirst: true,
          baseUrl: flags['base-url'],
        },
        { toolName: 'docs', task: { builder: args.builder, topic: args.topic ?? null } },
      );
      if (result.kind === 'search') {
        this.out.table(result.results, ['topic', 'title']);
        return;
      }
      if (result.kind === 'local') {
        this.out.info(result.content);
        return;
      }
      this.out.info(`# ${result.title}\n\n${result.content}`);
    } catch (err) {
      this.handleError(err);
    }
  }
}
