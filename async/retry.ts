// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

export class RetryError extends Error {
  constructor(cause: string) {
    super("Retry");
    this.name = "RetryError";
    this.cause = cause;
  }
}

export interface RetryOptions {
  /** How much to backoff after each retry. This is `2` by default. */
  multiplier?: number;
  /** The maximum milliseconds between retries. This is `60000` by default. */
  maxTimeout?: number;
  /** The maximum amount of retries until failure. This is `5` by default. */
  maxAttempts?: number;
  /** The inital and minimum amount of milliseconds between retries. This is `1000` by default. */
  minTimeout?: number;
}

const defaultRetryOptions = {
  multiplier: 2,
  maxTimeout: 60000,
  maxAttempts: 5,
  minTimeout: 1000,
};

/**
 * Creates a retry promise which resolves to the value of the input using exponential backoff.
 */
export async function retry<T>(
  fn: (() => Promise<T>) | (() => T),
  opts?: RetryOptions,
) {
  const options: Required<RetryOptions> = {
    ...defaultRetryOptions,
    ...opts,
  };

  if (options.maxTimeout >= 0 && options.minTimeout > options.maxTimeout) {
    throw new RangeError("minTimeout is greater than maxTimeout");
  }

  let timeout = options.minTimeout;
  let error = "";

  for (let i = 0; i < options.maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      await new Promise((r) => setTimeout(r, timeout));
      timeout *= options.multiplier;
      timeout = Math.max(timeout, options.minTimeout);
      if (options.maxTimeout >= 0) {
        timeout = Math.min(timeout, options.maxTimeout);
      }
      error = err as string;
    }
  }

  throw new RetryError(error);
}
