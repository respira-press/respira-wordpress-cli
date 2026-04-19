import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SitesDisconnect extends BaseCommand {
  static override description = 'remove a site from ~/.respira/sites.json (does not revoke the WP plugin key)';

  static override args = {
    site: Args.string({ required: true, description: 'site name or URL' }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    confirm: Flags.boolean({ description: 'skip the confirmation prompt' }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(SitesDisconnect);

    if (!flags.confirm) {
      this.out.error(
        `pass --confirm to remove ${args.site} from your local site store.\n` +
          'this does NOT revoke the plugin API key — do that from the WP admin if you want the connection fully killed.',
      );
      this.exit(2);
    }

    try {
      const removed = await this.client.sites.disconnect(args.site);
      if (!removed) {
        this.out.warn(`no local entry matched "${args.site}"`);
        this.out.json({ removed: false, site: args.site });
        return;
      }
      this.out.success(`removed ${args.site} from ~/.respira/sites.json`);
      this.out.json({ removed: true, site: args.site });
    } catch (err) {
      this.handleError(err);
    }
  }
}
