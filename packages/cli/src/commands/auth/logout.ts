import type { ToolChainFunction } from '@respira/cli-core';
import { createAuthStore } from '@respira/cli-core';
import { BaseCommand } from '../../base.js';

export const authLogoutFunction: ToolChainFunction<{ cleared: true }> = {
  name: 'auth.logout',
  description: 'remove the stored API key from the auth store',
  domainTags: ['auth', 'write'],
  capability: 'write',
  prerequisites: [],
  async execute() {
    const store = await createAuthStore();
    await store.clear();
    return { cleared: true };
  },
};

export default class AuthLogout extends BaseCommand {
  static override description = 'remove the stored API key';
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    try {
      await this.runThroughCycle(
        authLogoutFunction,
        {},
        { toolName: 'auth logout' },
      );
      this.out.success('signed out');
    } catch (err) {
      this.handleError(err);
    }
  }
}
