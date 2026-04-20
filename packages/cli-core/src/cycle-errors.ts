/**
 * Phase-aware error taxonomy. Sits on top of the existing RespiraError family.
 *
 * The ExecutionCycle wraps any error thrown during a phase in a CycleError,
 * preserving the original as `cause`. Command handlers unwrap the cause for
 * user display and keep the full CycleError for --verbose traces.
 *
 * Frozen for v0.1.
 */

import type { CyclePhase } from './execution-cycle.js';

/**
 * Canonical codes for cycle-level failures. v0.1 uses:
 *  - PREREQUISITE_NOT_MET: a declared prerequisite failed validation.
 *  - VALIDATION_FAILED:    input did not match the expected shape.
 *  - TOOL_CHAIN_ERROR:     the function's execute() threw.
 *  - HOOK_ERROR:           reserved for v0.2. Unused but exported.
 *  - PHASE_ERROR:          an unexpected failure inside a phase itself.
 */
export const CycleErrorCode = {
  PrerequisiteNotMet: 'PREREQUISITE_NOT_MET',
  ValidationFailed: 'VALIDATION_FAILED',
  ToolChainError: 'TOOL_CHAIN_ERROR',
  HookError: 'HOOK_ERROR',
  PhaseError: 'PHASE_ERROR',
} as const;
export type CycleErrorCode =
  (typeof CycleErrorCode)[keyof typeof CycleErrorCode];

/**
 * Wraps any error raised inside the ExecutionCycle with the phase it happened
 * in, a cycle-level error code, and the original error as `cause`. Mirrors
 * the shape of RespiraError so the two taxonomies can coexist without
 * confusion.
 */
export class CycleError extends Error {
  readonly phase: CyclePhase;
  readonly code: CycleErrorCode | string;
  readonly hint?: string;

  constructor(
    phase: CyclePhase,
    code: CycleErrorCode | string,
    message: string,
    opts: { hint?: string; cause?: unknown } = {},
  ) {
    super(message, opts.cause ? { cause: opts.cause } : undefined);
    this.name = 'CycleError';
    this.phase = phase;
    this.code = code;
    this.hint = opts.hint;
  }

  toJSON(): {
    name: 'CycleError';
    phase: CyclePhase;
    code: CycleErrorCode | string;
    message: string;
    hint?: string;
    cause?: unknown;
  } {
    return {
      name: 'CycleError',
      phase: this.phase,
      code: this.code,
      message: this.message,
      hint: this.hint,
      cause: this.cause,
    };
  }
}

/**
 * Type guard for callers that need to distinguish cycle errors from other
 * thrown values when formatting output.
 */
export function isCycleError(err: unknown): err is CycleError {
  return err instanceof CycleError;
}
