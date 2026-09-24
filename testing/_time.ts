// Copyright 2018-2026 the Deno authors. MIT license.

type TimerFn = (...args: never[]) => unknown;

/** Subset of the `node:timers` module object that fake time interacts with. */
export interface NodeTimers {
  setTimeout: TimerFn;
  clearTimeout: TimerFn;
  setInterval: TimerFn;
  clearInterval: TimerFn;
  promises: NodeTimersPromises;
}

/**
 * Subset of the `node:timers/promises` module object that fake time interacts
 * with.
 */
export interface NodeTimersPromises {
  setTimeout: TimerFn;
}

// `process.getBuiltinModule()` is used instead of static `node:` imports so
// that this module does not add `node:` specifiers to the module graph, and
// so that runtimes without the Node compatibility layer skip the
// `node:timers` faking instead of failing to load this module.
const process = (globalThis as {
  process?: { getBuiltinModule?: (id: string) => unknown };
}).process;

/** The `node:timers` module object, if the runtime provides it. */
export const nodeTimers = process?.getBuiltinModule?.("node:timers") as
  | NodeTimers
  | undefined;

/** The `node:timers/promises` module object, if the runtime provides it. */
export const nodeTimersPromises = process?.getBuiltinModule?.(
  "node:timers/promises",
) as NodeTimersPromises | undefined;

/** Used internally for testing that fake time uses real time correctly. */
export const _internals = {
  Date,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  AbortSignalTimeout: AbortSignal.timeout,
  nodeTimersSetTimeout: nodeTimers?.setTimeout,
  nodeTimersClearTimeout: nodeTimers?.clearTimeout,
  nodeTimersSetInterval: nodeTimers?.setInterval,
  nodeTimersClearInterval: nodeTimers?.clearInterval,
  nodeTimersPromisesSetTimeout: nodeTimersPromises?.setTimeout,
};
