/**
 * Hook framework contracts for the Respira CLI execution cycle.
 *
 * v0.1 ships the contracts and a null registry. No callbacks register here yet.
 * v0.2 will replace NullHookRegistry with a manifest-backed implementation
 * without changing any of the names exported from this module.
 *
 * Every exported symbol here is frozen for v0.1. See docs/SPRINT-cli-v0.1.0-hook-scaffolding.md.
 */

import type { CycleContext } from './execution-cycle.js';

/**
 * The five framework-level hook points. Every Respira CLI command invocation
 * fires these in the order defined by the ExecutionCycle.
 *
 * - before_resolve  (action): observe the invocation, log, enforce policy.
 * - filter_plan     (filter): transform the candidate tool chain function list.
 * - before_execute  (action): final gate before the tool runs.
 * - filter_result   (filter): transform the tool's output before returning.
 * - after_execute   (action): record, notify, trigger follow-on.
 */
export const FrameworkHook = {
  BeforeResolve: 'before_resolve',
  FilterPlan: 'filter_plan',
  BeforeExecute: 'before_execute',
  FilterResult: 'filter_result',
  AfterExecute: 'after_execute',
} as const;
export type FrameworkHook = (typeof FrameworkHook)[keyof typeof FrameworkHook];

/**
 * Two hook types.
 *
 * Action hooks receive a payload, return nothing, and are used for side-effects
 * (logging, notification, policy enforcement).
 *
 * Filter hooks receive a payload, return a transformed payload of the same
 * shape, and are used to modify data flowing through the cycle.
 */
export const HookType = {
  Action: 'action',
  Filter: 'filter',
} as const;
export type HookType = (typeof HookType)[keyof typeof HookType];

/**
 * A hook declared by a tool chain function or the framework.
 *
 * `payloadSchema` is `unknown` in v0.1; v0.2 will type it as a zod schema.
 * `errorPolicy` controls what happens when a callback throws:
 *   - `abort`: the cycle fails with a CycleError.
 *   - `skip`: the callback's contribution is ignored (default).
 *   - `substitute`: the filter chain uses the previous payload value.
 */
export interface HookDeclaration {
  readonly name: string;
  readonly type: HookType;
  readonly payloadSchema?: unknown;
  readonly errorPolicy?: 'abort' | 'skip' | 'substitute';
}

/**
 * A single callback registered against a hook. Populated by v0.2; always empty
 * in v0.1.
 */
export interface Callback {
  readonly extension: string;
  readonly priority: number;
  readonly handler: (
    payload: unknown,
    ctx: CycleContext,
  ) => Promise<unknown | void>;
}

/**
 * Contract every hook registry must satisfy. The ExecutionCycle talks to this
 * interface only; v0.1 wires NullHookRegistry, v0.2 wires a manifest-backed
 * implementation. The interface does not change between versions.
 */
export interface HookRegistry {
  /**
   * Return the callbacks registered against a framework hook name, sorted by
   * priority (lowest first). v0.1 always returns an empty array.
   */
  callbacks(hookName: string): Callback[];

  /**
   * Return the hook declarations a tool chain function exposes. v0.1 always
   * returns an empty array; v0.2 will read from the function's `internalHooks`
   * metadata.
   */
  declarations(toolChainFunctionName: string): HookDeclaration[];
}

/**
 * Null-object HookRegistry used by v0.1. Every query returns an empty array.
 * The ExecutionCycle loops over these empty arrays, so the hook-firing code
 * path is exercised in v0.1 without any observable effect.
 */
export class NullHookRegistry implements HookRegistry {
  callbacks(_hookName: string): Callback[] {
    return [];
  }

  declarations(_toolChainFunctionName: string): HookDeclaration[] {
    return [];
  }
}
