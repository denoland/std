// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

const defaultRetryOptions = {
  multiplier: 2,
  maxTimeout: 60000,
  maxAttempts: 5,
  minTimeout: 100,
};

export interface RetryOptions {
  /** How much to backoff after each retry. This is `2` by default. */
  multiplier: number;
  /** The maximum milliseconds between retries. This is `60000` by default. */
  maxTimeout: number;
  /** The maximum amount of retries until failure. This is `5` by default. */
  maxAttempts: number;
  /** The inital and minimum amount of milliseconds between retries. This is `100` by default. */
  minTimeout: number;
}

export async function retry<T>(
  fn: (() => Promise<T>) | (() => T),
  opts?: RetryOptions,
) {
  opts = {
    ...defaultRetryOptions,
    ...opts,
  };

  if (opts.maxTimeout >= 0 && opts.minTimeout > opts.maxTimeout) {
    throw "minTimeout is greater than maxTimeout";
  }

  let timeout = opts.minTimeout;
  let error = undefined;

  for (let i = 0; i < opts.maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      await new Promise((r) => setTimeout(r, timeout));
      timeout *= opts.multiplier;
      timeout = Math.max(timeout, opts.minTimeout);
      if (opts.maxTimeout >= 0) timeout = Math.min(timeout, opts.maxTimeout);
      error = err;
    }
  }

  throw error;
}
