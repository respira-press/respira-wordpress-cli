import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadMedia extends BaseCommand {
  static override description = 'list media items';
  static override args = { site: Args.string({ required: true }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    type: Flags.string({ options: ['image', 'video', 'audio', 'document'] }),
    limit: Flags.integer({ default: 50 }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(ReadMedia);
    try {
      const media = await this.client.read.media(args.site, {
        type: flags.type as 'image' | 'video' | 'audio' | 'document' | undefined,
        limit: flags.limit,
      });
      this.out.table(media, ['id', 'filename', 'mimeType', 'url']);
    } catch (err) {
      this.handleError(err);
    }
  }
}
