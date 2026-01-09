// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Provide helpers with asynchronous tasks, like {@linkcode delay},
 * {@linkcode debounce}, {@linkcode retry}, or
 * {@linkcode pooledMap}.
 *
 * ```ts no-assert
 * import { delay } from "@std/async/delay";
 *
 * await delay(100); // waits for 100 milliseconds
 * ```
 *
 * @module
 */

export * from "./abortable.ts";
export * from "./deadline.ts";
export * from "./debounce.ts";
export * from "./delay.ts";
export * from "./mux_async_iterator.ts";
export * from "./pool.ts";
export * from "./tee.ts";
export * from "./retry.ts";
