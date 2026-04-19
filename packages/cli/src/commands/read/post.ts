import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class ReadPost extends BaseCommand {
  static override description = 'read a single post';
  static override args = {
    site: Args.string({ required: true }),
    post: Args.string({ required: true, description: 'post ID or slug' }),
  };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(ReadPost);
    try {
      const post = await this.client.read.post(args.site, args.post);
      this.out.json(post);
    } catch (err) {
      this.handleError(err);
    }
  }
}
