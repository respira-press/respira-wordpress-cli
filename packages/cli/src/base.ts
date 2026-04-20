import { Command, Flags } from '@oclif/core';
import { createRespiraClient, type RespiraClient } from '@respira/sdk';
import {
  createOutput,
  isRespiraError,
  ExecutionCycle,
  type CycleResult,
  type OutputWriter,
  type ToolChainFunction,
} from '@respira/cli-core';

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
  protected cycle!: ExecutionCycle;
  private verboseFlag = false;

  protected async initClient(opts: { anonymous?: boolean } = {}): Promise<void> {
    const { flags } = await this.parse(this.ctor as typeof BaseCommand);
    this.verboseFlag = Boolean(flags.verbose);
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
    this.cycle = new ExecutionCycle({ verbose: this.verboseFlag });
  }

  /**
   * Run a ToolChainFunction through the ExecutionCycle and return its data.
   *
   * Throws on failure (the original RespiraError when present, otherwise an
   * Error) so command handlers can keep their existing `try { ... } catch
   * (err) { this.handleError(err); }` shape with no behavior drift. When
   * --verbose is set, the trace file path is logged to stderr.
   */
  protected async runThroughCycle<T>(
    fn: ToolChainFunction<T>,
    input: unknown,
    context: {
      toolName: string;
      task?: Record<string, unknown>;
    },
  ): Promise<T> {
    const { flags } = await this.parse(this.ctor as typeof BaseCommand);
    const result: CycleResult<T> = await this.cycle.run(fn, input, {
      toolName: context.toolName,
      switches: flags as Record<string, unknown>,
      task: context.task ?? {},
    });

    if (this.verboseFlag && result.traceRef) {
      process.stderr.write(`[respira] trace: ${result.traceRef}\n`);
    }

    if (result.status === 'ok') {
      return result.data as T;
    }

    // Unwrap the original cause when the cycle captured one so users see the
    // familiar RespiraError messages and hints. The cycle-level wrapper is
    // logged via --verbose tracing only.
    const cause = result.error?.cause;
    if (cause instanceof Error) throw cause;
    if (isRespiraError(cause)) throw cause;
    throw new Error(result.error?.message ?? 'unknown error');
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
