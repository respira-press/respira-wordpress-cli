import { Flags } from '@oclif/core';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes } from 'node:crypto';
import { AddressInfo } from 'node:net';
import open from 'open';
import type { ToolChainFunction } from '@respira/cli-core';
import { ApiClient, createAuthStore, renderWelcome, formatProgress } from '@respira/cli-core';
import { BaseCommand } from '../../base.js';

/**
 * Tool Chain Function for the exchange+store step of auth login. The OAuth
 * callback server and browser flow are orchestration and live in the Command
 * class. The cycle wraps the outer step: given (state, code), exchange for an
 * apiKey and persist it.
 */
export const authLoginFunction: ToolChainFunction<{ apiKey: string }> = {
  name: 'auth.login',
  description: 'exchange an OAuth code for an API key and persist it to the auth store',
  domainTags: ['auth', 'write'],
  capability: 'write',
  prerequisites: [],
  async execute(input) {
    const { state, code, baseUrl } = input as {
      state: string;
      code: string;
      baseUrl?: string;
    };
    const api = new ApiClient({ baseUrl, apiKey: null });
    const res = await api.request<{ apiKey: string }>('cli/auth/exchange', {
      method: 'POST',
      body: JSON.stringify({ state, code }),
    });
    if (!res.apiKey) {
      throw new Error('no apiKey returned from exchange endpoint');
    }
    const store = await createAuthStore();
    await store.set(res.apiKey);
    return { apiKey: res.apiKey };
  },
};

export default class AuthLogin extends BaseCommand {
  static override description = 'authenticate the CLI via browser and store the API key';

  static override examples = ['<%= config.bin %> auth login'];

  static override flags = {
    ...BaseCommand.baseFlags,
    'no-browser': Flags.boolean({ description: 'print the URL instead of opening a browser' }),
    'web-url': Flags.string({
      description: 'override the web URL used for the auth handshake',
      default: 'https://www.respira.press',
      env: 'RESPIRA_WEB_URL',
    }),
  };

  async run(): Promise<void> {
    await this.initClient({ anonymous: true });
    const { flags } = await this.parse(AuthLogin);
    const state = randomBytes(16).toString('hex');
    try {
      const { code } = await this.runCallbackServer(state, flags['no-browser'], flags['web-url']);
      await this.runThroughCycle(
        authLoginFunction,
        { state, code, baseUrl: flags['base-url'] },
        { toolName: 'auth login' },
      );
      // Re-init the client so it picks up the API key just written to the
      // keychain. The original client was anonymous and would 401 on whoami.
      await this.initClient();
      const user = await this.client.auth.whoami().catch(() => null);
      this.log('');
      this.log(renderWelcome({ email: user?.email ?? null }));
      this.log('');
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
        // Send Connection: close so the browser does not hold the socket open
        // with HTTP keep-alive, which would prevent server.close() from fully
        // releasing the port and keep the Node process alive.
        res.writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'connection': 'close',
        }).end(
          '<!doctype html><meta charset="utf-8"><title>respira cli</title><body style="font-family:system-ui;padding:40px;max-width:480px"><h1>you\'re authenticated.</h1><p>you can close this tab and return to your terminal.</p></body>',
        );
        // Force-destroy the socket on the next tick to release the keep-alive
        // and let the event loop drain so the CLI returns to the prompt.
        setImmediate(() => req.socket.destroy());
        resolve({ code, port: (server.address() as AddressInfo).port });
        server.close();
        server.closeAllConnections?.();
      });

      server.listen(0, '127.0.0.1', async () => {
        const { port } = server.address() as AddressInfo;
        const authUrl = `${webUrl.replace(/\/+$/, '')}/cli/auth?state=${state}&port=${port}`;
        // Register the state + port with the backend before opening the browser.
        // The /cli/auth page has a fallback that late-registers if this step fails,
        // so we don't block on it. Fire-and-forget and log on error.
        this.registerState(state, port).catch((err) => {
          this.out.debug(`register-state failed (handshake will still work via fallback): ${err?.message ?? err}`);
        });
        if (noBrowser) {
          this.log('');
          this.log(formatProgress(`open this URL to sign in: ${authUrl}`));
          this.log(formatProgress('waiting for confirmation'));
          this.log('');
        } else {
          this.log('');
          this.log(formatProgress('opening browser to sign in...'));
          this.log(formatProgress(`if the browser didn't open, visit: ${authUrl}`));
          this.log(formatProgress('waiting for confirmation'));
          this.log('');
          open(authUrl).catch(() => {
            this.log(formatProgress(`browser failed to open. visit: ${authUrl}`));
          });
        }
      });

      const timeout = setTimeout(
        () => {
          reject(
            new Error(
              [
                'sign-in timed out after 5 minutes',
                '  try again with: respira auth login',
                '  or check the docs: https://respira.press/cli/docs/authentication',
              ].join('\n'),
            ),
          );
          server.close();
        },
        5 * 60 * 1000,
      );
      server.on('close', () => clearTimeout(timeout));
    });
  }

  private async registerState(state: string, port: number): Promise<void> {
    const { flags } = await this.parse(AuthLogin);
    const api = new ApiClient({ baseUrl: flags['base-url'], apiKey: null });
    await api.request('cli/auth/register-state', {
      method: 'POST',
      body: JSON.stringify({ state, port }),
    });
  }
}
