import { BaseCommand } from '../../base.js';

export default class AuthStatus extends BaseCommand {
  static override description = 'show authentication state, tier, and rate limit remaining';
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    try {
      const status = await this.client.auth.status();
      this.out.json(status);
    } catch (err) {
      this.handleError(err);
    }
  }
}
