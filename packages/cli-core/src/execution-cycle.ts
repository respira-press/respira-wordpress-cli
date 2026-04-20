/**
 * Six-phase execution cycle for the Respira CLI.
 *
 * Every command invocation moves through the same deterministic phases:
 *   LoadContext → PreHooks → Resolve → Execute → PostHooks → Return
 *
 * Each phase records trace entries via the injected TraceEmitter. Errors are
 * caught at the phase boundary, wrapped in a CycleError, and returned in the
 * CycleResult: the cycle never re-throws to its caller.
 *
 * In v0.1 the hook registry is a NullHookRegistry (always returns empty
 * arrays). The hook-firing loops run but have no observable effect. v0.2
 * swaps in a manifest-backed registry without changing any signature here.
 */

import { randomUUID } from 'node:crypto';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { CycleError, CycleErrorCode } from './cycle-errors.js';
import {
  FrameworkHook,
  type Callback,
  type HookRegistry,
} from './hooks.js';
import { NullHookRegistry } from './hooks.js';
import type { ToolChainFunction } from './tool-chain-function.js';
import { TraceEmitter, type TraceEntry } from './trace.js';

/**
 * Six named phases. Every invocation fires them in this order.
 */
export const CyclePhase = {
  LoadContext: 'load_context',
  PreHooks: 'pre_hooks',
  Resolve: 'resolve',
  Execute: 'execute',
  PostHooks: 'post_hooks',
  Return: 'return',
} as const;
export type CyclePhase = (typeof CyclePhase)[keyof typeof CyclePhase];

/**
 * Invocation-scoped state that flows through every phase. Forward-looking
 * fields (hooks, inventory, constitution) live here so v0.2 can populate
 * them without changing any external API.
 */
export interface CycleContext {
  readonly invocationId: string;
  readonly toolName: string;
  readonly switches: Record<string, unknown>;
  readonly task: Record<string, unknown>;
  readonly startedAt: number;
  readonly trace: readonly TraceEntry[];
}

/**
 * What the cycle returns to its caller. Always includes `status` and
 * `invocationId`; other fields are populated depending on status.
 */
export interface CycleResult<T = unknown> {
  readonly status: 'ok' | 'error' | 'validation_failed' | 'license_required';
  readonly invocationId: string;
  readonly durationMs: number;
  readonly data?: T;
  readonly error?: {
    readonly code: string;
    readonly message: string;
    readonly hint?: string;
    /**
     * Original error captured by the cycle. Typically a RespiraError or a
     * plain Error. Command handlers use this to display the familiar user
     * message; the cycle-level `code`/`message`/`hint` carry the wrapper
     * info for --verbose tracing.
     */
    readonly cause?: unknown;
  };
  readonly traceRef?: string;
}

export interface ExecutionCycleOptions {
  /** When true, the cycle writes its trace to ~/.respira/traces/{id}.json. */
  readonly verbose?: boolean;
  /** Hook registry. Defaults to NullHookRegistry (v0.1 behavior). */
  readonly hookRegistry?: HookRegistry;
  /** Optional pre-constructed emitter. The cycle creates one if omitted. */
  readonly traceEmitter?: TraceEmitter;
  /** Override ~/.respira/traces base directory (used by tests). */
  readonly tracesDir?: string;
  /** Override process.cwd-dependent clock (used by tests for determinism). */
  readonly now?: () => number;
}

/**
 * The cycle orchestrator. Construct once per invocation or reuse across
 * invocations (each `run()` allocates a fresh CycleContext).
 */
export class ExecutionCycle {
  private readonly verbose: boolean;
  private readonly hookRegistry: HookRegistry;
  private readonly tracesDir: string;
  private readonly now: () => number;
  private readonly emitter: TraceEmitter;

  constructor(options: ExecutionCycleOptions = {}) {
    this.verbose = options.verbose ?? false;
    this.hookRegistry = options.hookRegistry ?? new NullHookRegistry();
    this.tracesDir = options.tracesDir ?? join(homedir(), '.respira', 'traces');
    this.now = options.now ?? Date.now;
    this.emitter = options.traceEmitter ?? new TraceEmitter();
  }

  /**
   * Run a tool chain function through all six phases. Returns a CycleResult
   * regardless of success or failure; errors are surfaced via `result.error`.
   */
  async run<T>(
    fn: ToolChainFunction<T>,
    input: unknown,
    context: Partial<CycleContext> = {},
  ): Promise<CycleResult<T>> {
    const startedAt = context.startedAt ?? this.now();
    const invocationId = context.invocationId ?? randomUUID();
    const ctx: CycleContext = {
      invocationId,
      toolName: context.toolName ?? fn.name,
      switches: context.switches ?? {},
      task: context.task ?? {},
      startedAt,
      trace: this.emitter.snapshot(),
    };

    let data: T | undefined;
    let phaseError: CycleError | null = null;
    let lastPhase: CyclePhase = CyclePhase.LoadContext;

    // ───── Phase 1: LoadContext ─────
    try {
      lastPhase = CyclePhase.LoadContext;
      this.startPhase(lastPhase);
      // v0.1: the base command has already assembled switches/task before
      // calling run(). Nothing to do here except mark the phase.
      this.endPhase(lastPhase, 'ok');
    } catch (err) {
      phaseError = this.wrapPhaseError(lastPhase, err);
    }

    // ───── Phase 2: PreHooks ─────
    if (!phaseError) {
      try {
        lastPhase = CyclePhase.PreHooks;
        this.startPhase(lastPhase);
        await this.fireHook(
          FrameworkHook.BeforeResolve,
          { fn: fn.name, input },
          ctx,
        );
        this.endPhase(lastPhase, 'ok');
      } catch (err) {
        phaseError = this.wrapPhaseError(lastPhase, err);
      }
    }

    // ───── Phase 3: Resolve ─────
    if (!phaseError) {
      try {
        lastPhase = CyclePhase.Resolve;
        this.startPhase(lastPhase);
        // v0.1: the tool chain function was selected by oclif routing. The
        // resolve phase records a prerequisite_check event per declared
        // prerequisite. No enforcement yet; v0.2 validates against the Site
        // Inventory here.
        for (const req of fn.prerequisites) {
          this.emitter.record({
            phase: CyclePhase.Resolve,
            event: 'prerequisite_check',
            status: 'skipped',
            details: { type: req.type, name: req.name, required: req.required },
          });
        }
        this.endPhase(lastPhase, 'ok');
      } catch (err) {
        phaseError = this.wrapPhaseError(lastPhase, err);
      }
    }

    // ───── Phase 4: Execute ─────
    if (!phaseError) {
      lastPhase = CyclePhase.Execute;
      this.startPhase(lastPhase);
      const execStart = this.now();
      try {
        data = await fn.execute(input, ctx);
        this.emitter.record({
          phase: CyclePhase.Execute,
          event: 'tool_chain_executed',
          durationMs: this.now() - execStart,
          status: 'ok',
          details: { fn: fn.name },
        });
        this.endPhase(lastPhase, 'ok');
      } catch (err) {
        this.emitter.record({
          phase: CyclePhase.Execute,
          event: 'tool_chain_executed',
          durationMs: this.now() - execStart,
          status: 'error',
          details: { fn: fn.name },
        });
        phaseError = new CycleError(
          CyclePhase.Execute,
          CycleErrorCode.ToolChainError,
          err instanceof Error ? err.message : String(err),
          { cause: err },
        );
      }
    }

    // ───── Phase 5: PostHooks ─────
    if (!phaseError) {
      try {
        lastPhase = CyclePhase.PostHooks;
        this.startPhase(lastPhase);
        // FilterResult first (may transform data), then AfterExecute (observe).
        const filtered = await this.fireFilter(
          FrameworkHook.FilterResult,
          data,
          ctx,
        );
        data = filtered as T | undefined;
        await this.fireHook(
          FrameworkHook.AfterExecute,
          { fn: fn.name, data },
          ctx,
        );
        this.endPhase(lastPhase, 'ok');
      } catch (err) {
        phaseError = this.wrapPhaseError(lastPhase, err);
      }
    }

    // ───── Phase 6: Return ─────
    lastPhase = CyclePhase.Return;
    this.startPhase(lastPhase);
    const durationMs = this.now() - startedAt;
    let traceRef: string | undefined;
    if (this.verbose) {
      const path = join(this.tracesDir, `${invocationId}.json`);
      try {
        await this.emitter.writeToFile(path);
        traceRef = path;
      } catch (err) {
        // Trace write failure must not fail the cycle. Record the event and
        // continue without traceRef.
        this.emitter.record({
          phase: CyclePhase.Return,
          event: 'error',
          status: 'error',
          details: {
            message:
              err instanceof Error ? err.message : 'trace write failed',
          },
        });
      }
    }
    this.endPhase(lastPhase, phaseError ? 'error' : 'ok');

    if (phaseError) {
      return {
        status: this.classifyError(phaseError),
        invocationId,
        durationMs,
        error: {
          code: phaseError.code,
          message: phaseError.message,
          hint: phaseError.hint,
          cause: phaseError.cause,
        },
        traceRef,
      };
    }

    return {
      status: 'ok',
      invocationId,
      durationMs,
      data,
      traceRef,
    };
  }

  /**
   * Expose the emitter so tests and command handlers can inspect the trace
   * without re-running the cycle. Read-only by convention.
   */
  get trace(): TraceEmitter {
    return this.emitter;
  }

  // ───── helpers ─────

  private startPhase(phase: CyclePhase): void {
    this.emitter.record({ phase, event: 'phase_start' });
  }

  private endPhase(phase: CyclePhase, status: 'ok' | 'error'): void {
    this.emitter.record({ phase, event: 'phase_end', status });
  }

  private wrapPhaseError(phase: CyclePhase, err: unknown): CycleError {
    if (err instanceof CycleError) return err;
    return new CycleError(
      phase,
      CycleErrorCode.PhaseError,
      err instanceof Error ? err.message : String(err),
      { cause: err },
    );
  }

  /**
   * Fire an action hook: iterate callbacks, run them sequentially, ignore
   * return values. In v0.1 callbacks is always []; the loop does nothing.
   */
  private async fireHook(
    hookName: string,
    payload: unknown,
    ctx: CycleContext,
  ): Promise<void> {
    const callbacks = this.hookRegistry.callbacks(hookName);
    this.emitter.record({
      phase: ctx.trace.length
        ? (ctx.trace[ctx.trace.length - 1]?.phase ?? CyclePhase.PreHooks)
        : CyclePhase.PreHooks,
      event: 'hook_fired',
      hookName,
      status: 'ok',
      details: { callbackCount: callbacks.length },
    });
    for (const cb of callbacks) {
      await this.runCallback(cb, payload, ctx);
    }
  }

  /**
   * Fire a filter hook: iterate callbacks, feed each one's output into the
   * next. In v0.1 callbacks is always []; returns the input unchanged.
   */
  private async fireFilter(
    hookName: string,
    payload: unknown,
    ctx: CycleContext,
  ): Promise<unknown> {
    const callbacks = this.hookRegistry.callbacks(hookName);
    this.emitter.record({
      phase: CyclePhase.PostHooks,
      event: 'hook_fired',
      hookName,
      status: 'ok',
      details: { callbackCount: callbacks.length },
    });
    let current = payload;
    for (const cb of callbacks) {
      const result = await this.runCallback(cb, current, ctx);
      if (result !== undefined) current = result;
    }
    return current;
  }

  private async runCallback(
    cb: Callback,
    payload: unknown,
    ctx: CycleContext,
  ): Promise<unknown | void> {
    const started = this.now();
    try {
      const result = await cb.handler(payload, ctx);
      this.emitter.record({
        phase: CyclePhase.PreHooks,
        event: 'callback_ran',
        callbackExtension: cb.extension,
        callbackPriority: cb.priority,
        durationMs: this.now() - started,
        status: 'ok',
      });
      return result;
    } catch (err) {
      this.emitter.record({
        phase: CyclePhase.PreHooks,
        event: 'callback_ran',
        callbackExtension: cb.extension,
        callbackPriority: cb.priority,
        durationMs: this.now() - started,
        status: 'error',
        details: {
          message: err instanceof Error ? err.message : String(err),
        },
      });
      // In v0.1 no callbacks exist. v0.2 will consult the HookDeclaration's
      // errorPolicy (abort/skip/substitute) to decide what to do here.
      // Default to skip so a misbehaving callback cannot break the cycle.
      return;
    }
  }

  /**
   * Map cycle-level error codes onto CycleResult status values. Unknown codes
   * classify as 'error'.
   */
  private classifyError(err: CycleError): CycleResult['status'] {
    if (err.code === CycleErrorCode.ValidationFailed) return 'validation_failed';
    const cause = err.cause as { code?: string } | undefined;
    if (cause?.code === 'LICENSE_REQUIRED') return 'license_required';
    return 'error';
  }
}
