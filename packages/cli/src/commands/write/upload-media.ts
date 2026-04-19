import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class WriteUploadMedia extends BaseCommand {
  static override description = 'upload a file to a site\'s media library';
  static override args = {
    site: Args.string({ required: true }),
    file: Args.string({ required: true, description: 'local path to the file' }),
  };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(WriteUploadMedia);
    try {
      const media = await this.client.write.uploadMedia(args.site, args.file);
      this.out.json(media);
    } catch (err) {
      this.handleError(err);
    }
  }
}
