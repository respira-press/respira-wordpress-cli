export * from './types/index.js';
export { createRespiraClient, type RespiraClient, type RespiraClientOptions } from './client.js';

import { createRespiraClient, type RespiraClient } from './client.js';

/**
 * Default Respira SDK client.
 *
 * Credential precedence: RESPIRA_API_KEY env var, OS keychain, ~/.respira/credentials.
 *
 * For advanced usage (custom base URL, explicit API key, testing, anonymous mode),
 * call createRespiraClient(opts) directly.
 */
export const respira: RespiraClient = createRespiraClient();
