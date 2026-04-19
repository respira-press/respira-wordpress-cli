import { Command, Flags } from '@oclif/core';
import { createRespiraClient, type RespiraClient } from '@respira/sdk';
import { createOutput, isRespiraError, type OutputWriter } from '@respira/cli-core';

export abstract class BaseCommand extends Command {
  static baseFlags = {
    output: Flags.string({
      description: 'output format',
      options: ['json', 'table', 'yaml', 'auto'],
      default: 'auto',
    }),
    quiet: Flags.boolean({ description: 'suppress non-essential output' }),
    verbose: Flags.boolean({ description: 'show debug output' }),
    'no-color': Flags.boolean({ description: 'disable colored output' }),
    'base-url': Flags.string({
      description: 'override the respira.press API base URL',
      env: 'RESPIRA_API_BASE_URL',
      helpGroup: 'GLOBAL',
    }),
  };

  protected out!: OutputWriter;
  protected client!: RespiraClient;

  protected async initClient(opts: { anonymous?: boolean } = {}): Promise<void> {
    const { flags } = await this.parse(this.ctor as typeof BaseCommand);
    this.out = createOutput({
      format: flags.output as 'json' | 'table' | 'yaml' | 'auto',
      quiet: flags.quiet,
      verbose: flags.verbose,
      noColor: flags['no-color'] || process.env.NO_COLOR != null,
      isTTY: process.stdout.isTTY,
    });
    this.client = createRespiraClient({
      baseUrl: flags['base-url'],
      anonymous: opts.anonymous,
    });
  }

  protected handleError(err: unknown): never {
    if (isRespiraError(err)) {
      this.out.error(err.message);
      if (err.hint) this.out.info(`hint: ${err.hint}`);
      this.exit(1);
    }
    if (err instanceof Error) {
      this.out.error(err.message);
      this.exit(1);
    }
    this.out.error(String(err));
    this.exit(1);
  }
}
