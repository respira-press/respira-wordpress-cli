import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class WriteDeletePage extends BaseCommand {
  static override description = 'delete a page (destructive, requires --confirm)';
  static override args = {
    site: Args.string({ required: true }),
    page: Args.string({ required: true }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    confirm: Flags.boolean({ required: true, description: 'required to execute the delete' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(WriteDeletePage);
    if (!flags.confirm) {
      this.out.error('--confirm is required to delete');
      this.exit(2);
    }
    try {
      await this.client.write.deletePage(args.site, args.page, { confirm: true });
      this.out.success(`deleted ${args.page}`);
    } catch (err) {
      this.handleError(err);
    }
  }
}
