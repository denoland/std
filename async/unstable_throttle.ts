// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode throttle} */
export type ThrottleOptions = {
  /**
   * If `true`, the most recent call will always be executed once the given timeframe elapses with no further calls.
   * Otherwise, the most recent call may not be executed if it was throttled due to a previous call.
   * @default {false}
   */
  ensureLastCall?: boolean;
};

/**
 * A throttled function that will be executed at most once during the
 * specified `timeframe` in milliseconds.
 */
export interface ThrottledFunction<T extends Array<unknown>> {
  (...args: T): void;
  /**
   * Clears the throttling state.
   * {@linkcode ThrottledFunction.lastExecution} will be reset to `-Infinity` and
   * {@linkcode ThrottledFunction.throttling} will be reset to `false`.
   */
  clear(): void;
  /**
   * Execute the last throttled call (if any) and clears the throttling state.
   */
  flush(): void;
  /**
   * Returns a boolean indicating whether the function is currently being throttled.
   */
  readonly throttling: boolean;
  /**
   * Returns the timestamp of the last execution of the throttled function.
   * It is set to `-Infinity` if it has not been called yet, or reset is called after the last call.
   */
  readonly lastExecution: number;
}

/**
 * Creates a throttled function that prevents the given `func`
 * from being called more than once within a given `timeframe` in milliseconds.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { throttle } from "@std/async/unstable-throttle";
 * import { retry } from "@std/async/retry";
 * import { assert } from "@std/assert";
 *
 * let called = 0;
 * const requestReceived = Promise.withResolvers<void>();
 * await using server = Deno.serve({ port: 0 }, () => {
 *   requestReceived.resolve();
 *   return new Response(`${called++}`);
 * });
 *
 * // A throttled function will be executed at most once during a specified ms timeframe
 * const timeframe = 100;
 * const func = throttle<[string]>((url) => fetch(url).then(r => r.body?.cancel()), timeframe);
 * for (let i = 0; i < 10; i++) {
 *   func(`http://localhost:${server.addr.port}/api`);
 * }
 *
 * await retry(() => assert(!func.throttling));
 * await requestReceived.promise;
 * assert(called === 1);
 * assert(func.lastExecution > 0);
 * ```
 *
 * @typeParam T The arguments of the provided function.
 * @param fn The function to throttle.
 * @param timeframe The timeframe in milliseconds in which the function should be called at most once.
 * If a callback function is supplied, it will be called with the duration of
 * the previous execution and should return the
 * next timeframe to use in milliseconds.
 * @param options Additional options.
 * @returns The throttled function.
 */
// deno-lint-ignore no-explicit-any
export function throttle<T extends Array<any>>(
  fn: (this: ThrottledFunction<T>, ...args: T) => void,
  timeframe: number | ((previousDuration: number) => number),
  options?: ThrottleOptions,
): ThrottledFunction<T> {
  const ensureLast = Boolean(options?.ensureLastCall);
  let timeout = -1;

  let lastExecution = -Infinity;
  let flush: (() => void | Promise<void>) | null = null;

  let tf = typeof timeframe === "function" ? 0 : timeframe;

  const throttled = ((...args: T) => {
    flush = () => {
      const start = Date.now();
      let result: unknown;
      const done = () => {
        lastExecution = Date.now();
        if (typeof timeframe === "function") {
          tf = timeframe(lastExecution - start);
        }
      };
      try {
        clearTimeout(timeout);
        result = fn.call(throttled, ...args);
      } finally {
        if (isPromiseLike(result)) {
          result.finally(done);
        } else {
          done();
        }
        flush = null;
      }
    };
    if (throttled.throttling) {
      if (ensureLast) {
        clearTimeout(timeout);
        timeout = setTimeout(() => flush?.(), tf);
      }
      return;
    }
    flush?.();
  }) as ThrottledFunction<T>;

  throttled.clear = () => {
    lastExecution = -Infinity;
  };

  throttled.flush = () => {
    flush?.();
  };

  Object.defineProperties(throttled, {
    throttling: { get: () => Date.now() - lastExecution <= tf },
    lastExecution: { get: () => lastExecution },
  });

  return throttled;
}

function isPromiseLike(obj: unknown): obj is Promise<unknown> {
  return typeof (obj as Promise<unknown>)?.then === "function";
}
