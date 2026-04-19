import { Flags } from '@oclif/core';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { AddressInfo } from 'node:net';
import open from 'open';
import { ApiClient, createAuthStore } from '@respira/cli-core';
import { BaseCommand } from '../../base.js';

export default class AuthLogin extends BaseCommand {
  static override description = 'authenticate the CLI via browser and store the API key';

  static override examples = ['<%= config.bin %> auth login'];

  static override flags = {
    ...BaseCommand.baseFlags,
    'no-browser': Flags.boolean({ description: 'print the URL instead of opening a browser' }),
    'web-url': Flags.string({
      description: 'override the web URL used for the auth handshake',
      default: 'https://respira.press',
      env: 'RESPIRA_WEB_URL',
    }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { flags } = await this.parse(AuthLogin);
    const state = randomBytes(16).toString('hex');
    try {
      const { code, port } = await this.runCallbackServer(state, flags['no-browser'], flags['web-url']);
      const key = await this.exchange(state, code, flags['base-url']);
      const store = await createAuthStore();
      await store.set(key);
      const whoami = await this.client.auth.whoami().catch(() => null);
      if (whoami) {
        this.out.success(`authenticated as ${whoami.email}`);
      } else {
        this.out.success('authenticated. run: respira auth status');
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  private async runCallbackServer(
    state: string,
    noBrowser: boolean,
    webUrl: string,
  ): Promise<{ code: string; port: number }> {
    return new Promise((resolve, reject) => {
      const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url ?? '/', `http://127.0.0.1`);
        if (url.pathname !== '/callback') {
          res.writeHead(404).end('not found');
          return;
        }
        const returnedState = url.searchParams.get('state');
        const code = url.searchParams.get('code');
        if (!returnedState || returnedState !== state) {
          res.writeHead(400, { 'content-type': 'text/plain' }).end('state mismatch. close this window and try again.');
          reject(new Error('state mismatch in auth callback'));
          server.close();
          return;
        }
        if (!code) {
          res.writeHead(400, { 'content-type': 'text/plain' }).end('missing code. close this window and try again.');
          reject(new Error('missing code in auth callback'));
          server.close();
          return;
        }
        res.writeHead(200, { 'content-type': 'text/html' }).end(
          '<!doctype html><meta charset="utf-8"><title>respira cli</title><body style="font-family:system-ui;padding:40px;max-width:480px"><h1>you\'re authenticated.</h1><p>you can close this tab and return to your terminal.</p></body>',
        );
        resolve({ code, port: (server.address() as AddressInfo).port });
        server.close();
      });

      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as AddressInfo;
        const authUrl = `${webUrl.replace(/\/+$/, '')}/cli/auth?state=${state}&port=${port}`;
        if (noBrowser) {
          this.out.info(`open this URL to authenticate:\n${authUrl}`);
        } else {
          this.out.info(`opening browser. if it doesn't open automatically, visit: ${authUrl}`);
          open(authUrl).catch(() => {
            this.out.info(`browser failed to open. visit: ${authUrl}`);
          });
        }
      });

      const timeout = setTimeout(
        () => {
          reject(new Error('auth timed out after 5 minutes'));
          server.close();
        },
        5 * 60 * 1000,
      );
      server.on('close', () => clearTimeout(timeout));
    });
  }

  private async exchange(state: string, code: string, baseUrl?: string): Promise<string> {
    const api = new ApiClient({ baseUrl, apiKey: null });
    const res = await api.request<{ apiKey: string }>('cli/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ state, code }),
    });
    if (!res.apiKey) throw new Error('no apiKey returned from exchange endpoint');
    return res.apiKey;
  }
}
