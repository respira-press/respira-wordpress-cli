import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const authStatusFunction: ToolChainFunction<unknown> = {
  name: 'auth.status',
  description: 'show authentication state, tier, and rate limit remaining',
  domainTags: ['auth', 'read'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { baseUrl } = input as { baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.auth.status();
  },
};

export default class AuthStatus extends BaseCommand {
  static override description = 'show authentication state, tier, and rate limit remaining';
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { flags } = await this.parse(AuthStatus);
    try {
      const status = await this.runThroughCycle(
        authStatusFunction,
        { baseUrl: flags['base-url'] },
        { toolName: 'auth status' },
      );
      this.out.json(status);
    } catch (err) {
      this.handleError(err);
    }
  }
}
