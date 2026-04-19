import { describe, it, expect } from 'vitest';
import { AuthRequiredError, LicenseRequiredError, RespiraError, isRespiraError } from '../src/errors.js';

describe('RespiraError', () => {
  it('includes a code and serializes to JSON', () => {
    const err = new RespiraError('INVALID_INPUT', 'bad request', { status: 400 });
    expect(err.code).toBe('INVALID_INPUT');
    expect(err.toJSON()).toMatchObject({ code: 'INVALID_INPUT', message: 'bad request', status: 400 });
  });

  it('AuthRequiredError carries the right code and hint', () => {
    const err = new AuthRequiredError();
    expect(err.code).toBe('AUTH_REQUIRED');
    expect(err.hint).toBe('respira auth login');
  });

  it('LicenseRequiredError points to pricing', () => {
    const err = new LicenseRequiredError();
    expect(err.code).toBe('LICENSE_REQUIRED');
    expect(err.hint).toContain('pricing');
  });

  it('isRespiraError narrows the type', () => {
    expect(isRespiraError(new RespiraError('NETWORK_ERROR', 'x'))).toBe(true);
    expect(isRespiraError(new Error('x'))).toBe(false);
  });
});
