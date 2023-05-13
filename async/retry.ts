// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export type BackoffFn = (
  cap: number,
  base: number,
  attempt: number,
  multiplier: number,
  prev: number,
) => number;

/**
 * Available backoff functions to calculate timing of retries, which can be passed as the `backoffFn` option to `retry`.
 *
 * A custom function implementing the `BackoffFn` type can also be passed.
 */
export const backoff = {
  /** no backoff (retries are sent instantaneously after failure) */
  none() {
    return 0;
  },
  /** exponential backoff with no jitter */
  exponential(cap, base, attempt, multiplier) {
    return Math.min(cap, base * multiplier ** attempt);
  },
  /** exponential backoff with full jitter (default) */
  fullJitter(cap, base, attempt, multiplier) {
    return randomBetween(0, Math.min(cap, base * multiplier ** attempt));
  },
  /** exponential backoff with equal jitter */
  equalJitter(cap, base, attempt, multiplier) {
    const temp = Math.min(cap, base * multiplier ** attempt);
    return temp / 2 + randomBetween(0, temp / 2);
  },
  /** exponential backoff with decorrelated jitter */
  decorrelatedJitter(cap, base, _attempt, multiplier, prev) {
    return Math.min(cap, randomBetween(base, prev * multiplier * 1.5));
  },
} satisfies Record<string, BackoffFn>;

export class RetryError extends Error {
  constructor(cause: unknown, count: number) {
    super(`Exceeded max retry count (${count})`);
    this.name = "RetryError";
    this.cause = cause;
  }
}

export interface RetryOptions {
  /**
   * Backoff function used to calculate timing of retries.
   *
   * By default, exponential backoff with full jitter is used.
   */
  backoffFn?: BackoffFn;
  /** How much to backoff after each retry. This is `2` by default. */
  multiplier?: number;
  /** The maximum milliseconds between retries. This is `60000` by default. `-1` indicates no maximum. */
  maxTimeout?: number;
  /** The maximum amount of retries until failure. This is `5` by default. */
  maxAttempts?: number;
  /** The inital and minimum amount of milliseconds between retries. This is `1000` by default. */
  minTimeout?: number;
}

const defaultRetryOptions: Required<RetryOptions> = {
  backoffFn: backoff.fullJitter,
  multiplier: 2,
  maxTimeout: 60000,
  maxAttempts: 5,
  minTimeout: 1000,
};

/**
 * Creates a retry promise which resolves to the value of the input using exponential backoff.
 * If the input promise throws, it will be retried `maxAttempts` number of times.
 * It will retry the input every certain amount of milliseconds, starting at `minTimeout` and multiplying by the `multiplier` until it reaches the `maxTimeout`
 *
 * @example
 * ```typescript
 * import { retry } from "https://deno.land/std@$STD_VERSION/async/mod.ts";
 * const req = async () => {
 *  // some function that throws sometimes
 * };
 *
 * // Below resolves to the first non-error result of `req`
 * const retryPromise = await retry(req, {
 *  multiplier: 2,
 *  maxTimeout: 60000,
 *  maxAttempts: 5,
 *  minTimeout: 100,
 * });
 * ```
 */
export async function retry<T>(
  fn: (() => Promise<T>) | (() => T),
  opts?: RetryOptions,
) {
  const options: Required<RetryOptions> = {
    ...defaultRetryOptions,
    ...opts,
  };

  options.maxTimeout = options.maxTimeout < 0 ? Infinity : options.maxTimeout;

  if (options.maxTimeout >= 0 && options.minTimeout > options.maxTimeout) {
    throw new RangeError("minTimeout is greater than maxTimeout");
  }

  let timeout = options.minTimeout;
  let error: unknown;

  for (let i = 0; i < options.maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      await new Promise((r) => setTimeout(r, timeout));

      timeout = options.backoffFn(
        options.maxTimeout,
        options.minTimeout,
        i,
        options.multiplier,
        timeout,
      );

      error = err;
    }
  }

  throw new RetryError(error, options.maxAttempts);
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
