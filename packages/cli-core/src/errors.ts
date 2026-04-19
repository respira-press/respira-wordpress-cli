export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID: 'AUTH_INVALID',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  LICENSE_REQUIRED: 'LICENSE_REQUIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  RATE_LIMITED: 'RATE_LIMITED',
  SITE_NOT_FOUND: 'SITE_NOT_FOUND',
  SITE_UNREACHABLE: 'SITE_UNREACHABLE',
  PAGE_NOT_FOUND: 'PAGE_NOT_FOUND',
  BUILDER_UNSUPPORTED: 'BUILDER_UNSUPPORTED',
  INVALID_INPUT: 'INVALID_INPUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DRY_RUN: 'DRY_RUN',
  CANCELLED: 'CANCELLED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class RespiraError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly hint?: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    opts: { status?: number; hint?: string; details?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message, opts.cause ? { cause: opts.cause } : undefined);
    this.name = 'RespiraError';
    this.code = code;
    this.status = opts.status;
    this.hint = opts.hint;
    this.details = opts.details;
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      hint: this.hint,
      details: this.details,
    };
  }
}

export class AuthRequiredError extends RespiraError {
  constructor(message = 'not authenticated. run: respira auth login') {
    super(ErrorCodes.AUTH_REQUIRED, message, { hint: 'respira auth login' });
  }
}

export class LicenseRequiredError extends RespiraError {
  constructor(message = 'this command requires a paid Respira license') {
    super(ErrorCodes.LICENSE_REQUIRED, message, { hint: 'https://respira.press/pricing' });
  }
}

export class NetworkError extends RespiraError {
  constructor(message: string, cause?: unknown) {
    super(ErrorCodes.NETWORK_ERROR, message, { cause });
  }
}

export function isRespiraError(err: unknown): err is RespiraError {
  return err instanceof RespiraError;
}
