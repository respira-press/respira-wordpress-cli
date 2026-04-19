import { Args, Flags } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { BaseCommand } from '../base.js';

export default class Exec extends BaseCommand {
  static override description = 'execute a TypeScript script with @respira/sdk available as a global';
  static override args = {
    script: Args.string({ description: 'path to a .ts file (omit to read from stdin)' }),
  };
  static override flags = {
    ...BaseCommand.baseFlags,
    stdin: Flags.boolean({ description: 'read script from stdin' }),
    'dry-run': Flags.boolean({ description: 'compile and print the script without running it' }),
    site: Flags.string({ description: 'site to pass in as RESPIRA_DEFAULT_SITE' }),
  };

  async run(): Promise<void> {
    await this.initClient();
    const { args, flags } = await this.parse(Exec);
    const source = await this.readSource(args.script, flags.stdin);
    if (!source.trim()) {
      this.out.error('no script provided');
      this.exit(2);
    }
    const tempDir = await mkdtemp(join(tmpdir(), 'respira-exec-'));
    const scriptPath = join(tempDir, 'script.ts');
    const preamble = `import { respira, createRespiraClient } from '@respira/sdk';\n(globalThis as unknown as { respira: typeof respira }).respira = respira;\n(globalThis as unknown as { createRespiraClient: typeof createRespiraClient }).createRespiraClient = createRespiraClient;\n`;
    await writeFile(scriptPath, preamble + source, 'utf8');
    if (flags['dry-run']) {
      this.out.info(`dry run. would execute: tsx ${scriptPath}`);
      return;
    }
    const env = {
      ...process.env,
      RESPIRA_DEFAULT_SITE: flags.site ?? process.env.RESPIRA_DEFAULT_SITE ?? '',
    };
    const code = await new Promise<number>((resolve) => {
      const child = spawn('npx', ['tsx', scriptPath], { stdio: 'inherit', env });
      child.on('close', (c) => resolve(c ?? 1));
      child.on('error', () => resolve(1));
    });
    this.exit(code);
  }

  private async readSource(path: string | undefined, fromStdin: boolean): Promise<string> {
    if (fromStdin || !path) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      return Buffer.concat(chunks).toString('utf8');
    }
    return readFile(path, 'utf8');
  }
}
