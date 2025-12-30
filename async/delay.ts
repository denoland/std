// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode delay}. */
export interface DelayOptions {
  /** Signal used to abort the delay. */
  signal?: AbortSignal;
  /** Indicates whether the process should continue to run as long as the timer exists.
   *
   * @default {true}
   */
  persistent?: boolean;
}

// Make type available in browser environments; we catch the `ReferenceError` below
declare const Deno: { unrefTimer(id: number): void };

/**
 * Resolve a {@linkcode Promise} after a given amount of milliseconds.
 *
 * If the optional signal is aborted before the delay duration, the returned
 * promise rejects with the signal's reason. If no reason is provided to
 * `abort()`, the browser's default `DOMException` with name `"AbortError"` is used.
 *
 * @param ms Duration in milliseconds for how long the delay should last.
 * @param options Additional options.
 *
 * @example Basic usage
 * ```ts no-assert
 * import { delay } from "@std/async/delay";
 *
 * // ...
 * const delayedPromise = delay(100);
 * const result = await delayedPromise;
 * // ...
 * ```
 *
 * @example Disable persistence
 *
 * Setting `persistent` to `false` will allow the process to continue to run as
 * long as the timer exists.
 *
 * ```ts no-assert ignore
 * import { delay } from "@std/async/delay";
 *
 * // ...
 * await delay(100, { persistent: false });
 * // ...
 * ```
 */
export function delay(ms: number, options: DelayOptions = {}): Promise<void> {
  const { signal, persistent = true } = options;
  if (signal?.aborted) return Promise.reject(signal.reason);
  return new Promise((resolve, reject) => {
    const abort = () => {
      clearTimeout(+i);
      reject(signal?.reason);
    };
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const i = setArbitraryLengthTimeout(done, ms);
    signal?.addEventListener("abort", abort, { once: true });
    if (persistent === false) {
      try {
        Deno.unrefTimer(+i);
      } catch (error) {
        if (!(error instanceof ReferenceError)) {
          clearTimeout(+i);
          throw error;
        }
        // deno-lint-ignore no-console
        console.error("`persistent` option is only available in Deno");
      }
    }
  });
}

const I32_MAX = 2 ** 31 - 1;

function setArbitraryLengthTimeout(
  callback: () => void,
  delay: number,
): { valueOf(): number } {
  // ensure non-negative integer (but > I32_MAX is OK, even if Infinity)
  delay = Math.trunc(Math.max(delay, 0) || 0);

  if (delay <= I32_MAX) {
    const id = Number(setTimeout(callback, delay));
    return { valueOf: () => id };
  }

  const start = Date.now();
  let timeoutId: number;

  const queueTimeout = () => {
    const currentDelay = delay - (Date.now() - start);
    timeoutId = currentDelay > I32_MAX
      ? Number(setTimeout(queueTimeout, I32_MAX))
      : Number(setTimeout(callback, currentDelay));
  };

  queueTimeout();

  return { valueOf: () => timeoutId };
}
