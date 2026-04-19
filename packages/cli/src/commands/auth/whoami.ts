import { BaseCommand } from '../../base.js';

export default class AuthWhoami extends BaseCommand {
  static override description = 'show account email and workspace';
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    try {
      const user = await this.client.auth.whoami();
      this.out.json(user);
    } catch (err) {
      this.handleError(err);
    }
  }
}
