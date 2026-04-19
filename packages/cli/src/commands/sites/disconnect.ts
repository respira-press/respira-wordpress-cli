import { Args, Flags } from '@oclif/core';
import { ApiClient, createAuthStore } from '@respira/cli-core';
import { BaseCommand } from '../../base.js';

export default class SitesDisconnect extends BaseCommand {
  static override description = 'remove a site from your workspace';
  static override args = { site: Args.string({ required: true, description: 'site URL or ID' }) };
  static override flags = {
    ...BaseCommand.baseFlags,
    confirm: Flags.boolean({ description: 'skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(SitesDisconnect);
    if (!flags.confirm) {
      this.out.error(`pass --confirm to remove ${args.site} from your workspace`);
      this.exit(2);
    }
    const store = await createAuthStore();
    const api = new ApiClient({
      baseUrl: flags['base-url'],
      apiKeyResolver: () => store.get(),
    });
    try {
      await api.request(`cli/sites/${encodeURIComponent(args.site)}`, { method: 'DELETE' });
      this.out.success(`removed ${args.site}`);
    } catch (err) {
      this.handleError(err);
    }
  }
}
