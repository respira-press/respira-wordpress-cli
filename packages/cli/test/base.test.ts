import { describe, it, expect } from 'vitest';
import { isRespiraError, RespiraError } from '@respira/cli-core';

describe('cli <-> cli-core integration', () => {
  it('isRespiraError is re-exported usable from the CLI side', () => {
    const err = new RespiraError('AUTH_INVALID', 'bad token');
    expect(isRespiraError(err)).toBe(true);
    expect(isRespiraError(new Error('x'))).toBe(false);
  });

  it('RespiraError toJSON has the expected shape for CLI error output', () => {
    const err = new RespiraError('RATE_LIMITED', 'slow down', { status: 429, hint: 'wait 60s' });
    expect(err.toJSON()).toMatchObject({
      code: 'RATE_LIMITED',
      message: 'slow down',
      status: 429,
      hint: 'wait 60s',
    });
  });
});
