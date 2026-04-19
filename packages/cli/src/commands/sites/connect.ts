import { Args } from '@oclif/core';
import { BaseCommand } from '../../base.js';

export default class SitesConnect extends BaseCommand {
  static override description = 'show installation instructions for connecting a WordPress site';
  static override args = { url: Args.string({ required: true, description: 'public URL of your WordPress site' }) };
  static override flags = BaseCommand.baseFlags;

  async run(): Promise<void> {
    await this.initClient();
    const { args } = await this.parse(SitesConnect);
    const instructions = [
      '',
      `to connect ${args.url} to your Respira workspace:`,
      '',
      '1. install the Respira for WordPress plugin from https://respira.press/plugin',
      '2. open Tools > Respira in the WP admin',
      '3. click "Connect to Respira" and follow the handshake',
      '4. return here and run: respira sites list',
      '',
    ].join('\n');
    this.out.info(instructions);
    this.out.json({ url: args.url, nextStep: 'install Respira plugin' });
  }
}
