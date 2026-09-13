// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import { exponentialBackoffWithJitter } from "./_util.ts";

/**
 * Options for {@linkcode exponentialBackoff}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface ExponentialBackoffOptions {
  /**
   * How much the delay grows with each attempt. Must be a finite number
   * greater than or equal to `1`.
   *
   * @default {2}
   */
  multiplier?: number;
  /**
   * The maximum delay in milliseconds, applied before jitter. Must be a
   * positive number, which may be `Infinity`.
   *
   * @default {60000}
   */
  maxTimeout?: number;
  /**
   * The initial delay in milliseconds, before jitter. Must be a finite number
   * greater than or equal to `0`, and no greater than `maxTimeout`.
   *
   * Note that this is not a lower bound on the returned delay: jitter reduces
   * the delay below it.
   *
   * @default {1000}
   */
  minTimeout?: number;
  /**
   * The fraction of the delay that is subject to random reduction. Must be a
   * finite number between `0` and `1`. This is `1` for full jitter by default.
   *
   * @default {1}
   */
  jitter?: number;
}

/**
 * Calculates how long to wait before a retry, using exponential backoff with
 * jitter.
 *
 * This is the backoff policy {@linkcode https://jsr.io/@std/async/doc/retry/~/retry | retry}
 * applies, exposed for callers that run their own retry loop. The delay is
 * `minTimeout` multiplied by `multiplier` to the power of `attempt`, capped at
 * `maxTimeout`, then reduced by a random fraction of up to `jitter`. In exact
 * arithmetic that puts the result in `((1 - jitter) * delay, delay]` for a
 * finite positive delay and positive jitter. Floating-point rounding can reach
 * the lower bound exactly, and a subnormal delay can round to `0`.
 *
 * Every call draws a new random sample, so calling this alongside
 * {@linkcode https://jsr.io/@std/async/doc/retry/~/retry | retry} reproduces
 * the policy, not the delays that `retry()` itself waited.
 *
 * With `maxTimeout: Infinity`, a large enough `attempt` returns `Infinity`.
 *
 * `multiplier ** attempt` is evaluated before the multiplication by
 * `minTimeout`, so an `attempt` large enough to overflow that power returns
 * `maxTimeout` even where the exact delay would be far smaller. This needs a
 * `minTimeout` below roughly `maxTimeout / 1.8e308`, and is shared with
 * {@linkcode https://jsr.io/@std/async/doc/retry/~/retry | retry}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param attempt The zero-based retry index: `0` for the delay before the
 * first retry, `1` before the second, and so on.
 * @param options Additional options.
 * @returns The delay in milliseconds, which may be fractional.
 * @throws {RangeError} If `attempt` or any option is outside its allowed range.
 *
 * @example Deterministic growth
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { exponentialBackoff } from "@std/async/unstable-backoff";
 *
 * assertEquals(exponentialBackoff(0, { minTimeout: 100, jitter: 0 }), 100);
 * assertEquals(exponentialBackoff(3, { minTimeout: 100, jitter: 0 }), 800);
 * ```
 *
 * @example Default jitter
 * ```ts
 * import { assert } from "@std/assert";
 * import { exponentialBackoff } from "@std/async/unstable-backoff";
 *
 * const ms = exponentialBackoff(3, { minTimeout: 100 });
 * assert(ms > 0 && ms <= 800);
 * ```
 */
export function exponentialBackoff(
  attempt: number,
  options?: ExponentialBackoffOptions,
): number {
  const {
    multiplier = 2,
    maxTimeout = 60000,
    minTimeout = 1000,
    jitter = 1,
  } = options ?? {};

  if (!Number.isSafeInteger(attempt) || attempt < 0) {
    throw new RangeError(
      `Cannot calculate backoff as 'attempt' must be a non-negative safe integer: current value is ${attempt}`,
    );
  }
  if (!Number.isFinite(multiplier) || multiplier < 1) {
    throw new RangeError(
      `Cannot calculate backoff as 'multiplier' must be a finite number >= 1: current value is ${multiplier}`,
    );
  }
  if (Number.isNaN(maxTimeout) || maxTimeout <= 0) {
    throw new RangeError(
      `Cannot calculate backoff as 'maxTimeout' must be a positive number: current value is ${maxTimeout}`,
    );
  }
  if (!Number.isFinite(minTimeout) || minTimeout < 0) {
    throw new RangeError(
      `Cannot calculate backoff as 'minTimeout' must be a finite number >= 0: current value is ${minTimeout}`,
    );
  }
  if (minTimeout > maxTimeout) {
    throw new RangeError(
      `Cannot calculate backoff as 'minTimeout' must be <= 'maxTimeout': current values 'minTimeout=${minTimeout}', 'maxTimeout=${maxTimeout}'`,
    );
  }
  if (Number.isNaN(jitter) || jitter < 0 || jitter > 1) {
    throw new RangeError(
      `Cannot calculate backoff as 'jitter' must be between 0 and 1: current value is ${jitter}`,
    );
  }

  // A zero base stays zero when exponentiation would overflow.
  if (minTimeout === 0) return 0;

  return exponentialBackoffWithJitter(
    maxTimeout,
    minTimeout,
    attempt,
    multiplier,
    jitter,
  );
}
