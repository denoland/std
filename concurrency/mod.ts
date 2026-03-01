// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Concurrency primitives for managing parallel execution, including
 * {@linkcode Semaphore}, {@linkcode CircuitBreaker}, and {@linkcode Lazy}.
 *
 * ```ts no-assert
 * import { Semaphore } from "@std/concurrency/semaphore";
 *
 * const sem = new Semaphore(3);
 * using _permit = await sem.acquire();
 * ```
 *
 * @module
 */

export * from "./semaphore.ts";
export * from "./circuit_breaker.ts";
export * from "./lazy.ts";
