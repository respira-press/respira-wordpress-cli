import type { ToolChainFunction } from '@respira/cli-core';
import { renderWelcomeShort } from '@respira/cli-core';
import { createRespiraClient, type User } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const authWhoamiFunction: ToolChainFunction<User> = {
  name: 'auth.whoami',
  description: 'show account email and workspace for the authenticated user',
  domainTags: ['auth', 'read'],
  capability: 'read',
  prerequisites: [],
  async execute(input) {
    const { baseUrl } = input as { baseUrl?: string };
    const client = createRespiraClient({ baseUrl });
    return client.auth.whoami();
  },
};

export default class AuthWhoami extends BaseCommand {
  static override description = 'show account email and workspace';
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { flags } = await this.parse(AuthWhoami);
    try {
      const user = await this.runThroughCycle(
        authWhoamiFunction,
        { baseUrl: flags['base-url'] },
        { toolName: 'auth whoami' },
      );
      // JSON for piped/--output=json contexts; otherwise the short welcome.
      if (flags.output === 'json' || !process.stdout.isTTY) {
        this.out.json(user);
      } else {
        this.log(renderWelcomeShort(user));
      }
    } catch (err) {
      this.handleError(err);
    }
  }
}
