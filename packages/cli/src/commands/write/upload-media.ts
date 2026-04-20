import { Args } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Media } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const writeUploadMediaFunction: ToolChainFunction<Media> = {
  name: 'write.upload-media',
  description: "upload a file to a site's media library",
  domainTags: ['media', 'write', 'connected', 'licensed'],
  capability: 'write',
  prerequisites: [
    { type: 'site_connected', required: true },
    { type: 'license', required: true },
  ],
  async execute(input) {
    const { site, file, baseUrl } = input as {
      site: string;
      file: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl });
    return client.write.uploadMedia(site, file);
  },
};

export default class WriteUploadMedia extends BaseCommand {
  static override description = "upload a file to a site's media library";
  static override args = {
    site: Args.string({ required: true }),
    file: Args.string({ required: true, description: 'local path to the file' }),
  };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteUploadMedia);
    try {
      const media = await this.runThroughCycle(
        writeUploadMediaFunction,
        { site: args.site, file: args.file, baseUrl: flags['base-url'] },
        { toolName: 'write upload-media', task: { site: args.site, file: args.file } },
      );
      this.out.json(media);
    } catch (err) {
      this.handleError(err);
    }
  }
}
