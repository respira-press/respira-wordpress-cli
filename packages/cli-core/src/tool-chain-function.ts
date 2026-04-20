/**
 * Tool Chain Function abstraction.
 *
 * Every CLI command defines a ToolChainFunction next to its oclif Command
 * class. The function carries metadata (capability, domain tags, prerequisites)
 * and an `execute` that the ExecutionCycle calls during the Execute phase.
 *
 * Interface frozen for v0.1. See docs/SPRINT-cli-v0.1.0-hook-scaffolding.md.
 */

import type { CycleContext } from './execution-cycle.js';
import type { HookDeclaration } from './hooks.js';

/**
 * Risk class of a tool chain function. Used by v0.2 for policy gating and
 * prerequisite enforcement; documented in v0.1.
 *
 * - read       : retrieves information, never mutates state.
 * - write      : creates or updates state. Reversible (duplicate-first when applicable).
 * - destructive: deletes state or performs irreversible side-effects.
 */
export type Capability = 'read' | 'write' | 'destructive';

/**
 * A declarative prerequisite a tool chain function needs satisfied before it
 * can run. Metadata only in v0.1; v0.2 validates these against the Site
 * Inventory during the Resolve phase.
 *
 * - builder       : a specific page builder must be active (e.g., elementor).
 * - plugin        : a WordPress plugin must be installed and active.
 * - license       : a paid Respira license is required.
 * - site_connected: the command targets a site registered in ~/.respira/sites.json.
 * - capability    : a custom capability flag (future use).
 */
export interface Prerequisite {
  readonly type:
    | 'builder'
    | 'plugin'
    | 'license'
    | 'site_connected'
    | 'capability';
  readonly name?: string;
  readonly version?: string;
  readonly required: boolean;
}

/**
 * The core unit of CLI work. Each oclif command file exports one of these and
 * passes it to ExecutionCycle.run(). The cycle reads the metadata to drive
 * routing (v0.2) and calls `execute` during the Execute phase.
 *
 * Type parameter `T` is the function's return shape. In v0.1 nothing reads
 * internalHooks; in v0.2 the cycle fires declared internal hooks during
 * execution.
 */
export interface ToolChainFunction<T = unknown> {
  readonly name: string;
  readonly description: string;
  readonly domainTags: readonly string[];
  readonly capability: Capability;
  readonly prerequisites: readonly Prerequisite[];
  readonly internalHooks?: readonly HookDeclaration[];
  execute(input: unknown, ctx: CycleContext): Promise<T>;
}

/**
 * Canonical domain tag vocabulary. Every tool chain function should pick tags
 * from these sets so v0.2's SQL-backed registry can filter deterministically.
 *
 * Functions may include more than one tag per dimension when relevant
 * (e.g., a function that works across all builders uses `none`).
 */
export const DomainTag = {
  builder: {
    elementor: 'elementor',
    divi: 'divi',
    bricks: 'bricks',
    gutenberg: 'gutenberg',
    beaver: 'beaver',
    oxygen: 'oxygen',
    wpbakery: 'wpbakery',
    visualComposer: 'visual-composer',
    brizy: 'brizy',
    thrive: 'thrive',
    breakdance: 'breakdance',
    flatsome: 'flatsome',
    none: 'none',
  },
  domain: {
    pages: 'pages',
    posts: 'posts',
    media: 'media',
    taxonomy: 'taxonomy',
    designSystem: 'design-system',
    snapshots: 'snapshots',
    tools: 'tools',
    docs: 'docs',
    sites: 'sites',
    auth: 'auth',
  },
  capability: {
    read: 'read',
    write: 'write',
    destructive: 'destructive',
  },
  access: {
    public: 'public',
    anonymous: 'anonymous',
    connected: 'connected',
    licensed: 'licensed',
  },
} as const;
