// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * A throttled function that will be executed at most once during the
 * specified `timeframe` in milliseconds.
 */
export interface ThrottledFunction<T extends Array<unknown>> {
  (...args: T): void;
  /**
   * Clears the throttling state.
   * {@linkcode ThrottledFunction.lastExecution} will be reset to `NaN` and
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
   * It is set to `NaN` if it has not been called yet.
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
 * ```ts ignore
 * import { throttle } from "@std/async/throttle";
 *
 * const apiCall = throttle<[string, unknown]>((url, body) => fetch(url, { method: "POST", body: JSON.stringify(body) }), 100);
 *
 * for (let i = 0; i < 10; i++) {
 *   apiCall("https://example.com/api", { foo: "bar" });
 * }
 *
 * // output: Function is only executed once during these 100ms
 * ```
 *
 * @typeParam T The arguments of the provided function.
 * @param fn The function to throttle.
 * @param timeframe The timeframe in milliseconds in which the function should be called at most once.
 * @returns The throttled function.
 */
// deno-lint-ignore no-explicit-any
export function throttle<T extends Array<any>>(
  fn: (this: ThrottledFunction<T>, ...args: T) => void,
  timeframe: number,
): ThrottledFunction<T> {
  let lastExecution = NaN;
  let flush: (() => void) | null = null;

  const throttled = ((...args: T) => {
    flush = () => {
      try {
        fn.call(throttled, ...args);
      } finally {
        lastExecution = Date.now();
        flush = null;
      }
    };
    if (throttled.throttling) {
      return;
    }
    flush?.();
  }) as ThrottledFunction<T>;

  throttled.clear = () => {
    lastExecution = NaN;
  };

  throttled.flush = () => {
    lastExecution = NaN;
    flush?.();
    throttled.clear();
  };

  Object.defineProperties(throttled, {
    throttling: { get: () => Date.now() - lastExecution <= timeframe },
    lastExecution: { get: () => lastExecution },
  });

  return throttled;
}
