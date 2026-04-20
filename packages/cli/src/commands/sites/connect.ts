import { Args, Flags } from '@oclif/core';
import type { ToolChainFunction } from '@respira/cli-core';
import { createRespiraClient, type Site } from '@respira/sdk';
import { BaseCommand } from '../../base.js';

export const sitesConnectFunction: ToolChainFunction<Site> = {
  name: 'sites.connect',
  description: 'store a WordPress site + plugin API key in ~/.respira/sites.json',
  domainTags: ['sites', 'write'],
  capability: 'write',
  prerequisites: [],
  async execute(input) {
    const { url, apiKey, name, baseUrl } = input as {
      url: string;
      apiKey: string;
      name?: string;
      baseUrl?: string;
    };
    const client = createRespiraClient({ baseUrl, anonymous: true });
    return client.sites.connect({ url, apiKey, name });
  },
};

export default class SitesConnect extends BaseCommand {
  static override description = 'store a WordPress site + plugin API key in ~/.respira/sites.json';

  static override examples = [
    '<%= config.bin %> sites connect https://mysite.com --key=respira_abcd1234',
    '<%= config.bin %> sites connect https://mysite.com --key=respira_abcd1234 --name=mysite',
  ];

  static override args = {
    url: Args.string({ required: true, description: 'public URL of your WordPress site' }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    key: Flags.string({
      description: 'the plugin API key (starts with respira_) from Tools > Respira > API keys in wp-admin',
    }),
    name: Flags.string({ description: 'short label for this site (default: host part of url)' }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { args, flags } = await this.parse(SitesConnect);

    if (!flags.key) {
      this.out.info(
        [
          '',
          `to connect ${args.url}, get a plugin API key first:`,
          '',
          '1. install the Respira for WordPress plugin from https://respira.press/plugin',
          '2. open Tools > Respira > API keys in wp-admin',
          '3. click "Generate key" and copy the respira_... value',
          '4. then run:',
          '',
          `   respira sites connect ${args.url} --key=respira_...`,
          '',
        ].join('\n'),
      );
      this.out.json({ url: args.url, nextStep: 'install Respira plugin + get a plugin API key' });
      return;
    }

    try {
      const site = await this.runThroughCycle(
        sitesConnectFunction,
        { url: args.url, apiKey: flags.key, name: flags.name, baseUrl: flags['base-url'] },
        { toolName: 'sites connect', task: { url: args.url } },
      );
      this.out.success(`connected ${site.name} → ${site.url}`);
      this.out.json(site);
    } catch (err) {
      this.handleError(err);
    }
  }
}
