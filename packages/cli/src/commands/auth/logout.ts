import { createAuthStore } from '@respira/cli-core';
import { BaseCommand } from '../../base.js';

export default class AuthLogout extends BaseCommand {
  static override description = 'remove the stored API key';
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const store = await createAuthStore();
    await store.clear();
    this.out.success('signed out');
  }
}
