// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A debounced function that will be delayed by a given `wait`
 * time in milliseconds. If the method is called again before
 * the timeout expires, the previous call will be aborted.
 */
// deno-lint-ignore no-explicit-any
export interface DebouncedFunction<Fn extends (...args: any[]) => any> {
  Fn;
  /** Clears the debounce timeout and omits calling the debounced function. */
  clear(): void;
  /** Clears the debounce timeout and calls the debounced function immediately. */
  flush(): void;
  /** Returns a boolean whether a debounce call is pending or not. */
  readonly pending: boolean;
}

/**
 * Creates a debounced function that delays the given `func`
 * by a given `wait` time in milliseconds. If the method is called
 * again before the timeout expires, the previous call will be
 * aborted.
 *
 * @example Usage
 * ```ts ignore
 * import { debounce } from "@std/async/debounce";
 *
 * const log = debounce(
 *   (event: Deno.FsEvent) =>
 *     console.log("[%s] %s", event.kind, event.paths[0]),
 *   200,
 * );
 *
 * for await (const event of Deno.watchFs("./")) {
 *   log(event);
 * }
 * // wait 200ms ...
 * // output: Function debounced after 200ms with baz
 * ```
 *
 * @typeParam Fn The provided function.
 * @param fn The function to debounce.
 * @param wait The time in milliseconds to delay the function.
 * @returns The debounced function.
 */
// deno-lint-ignore no-explicit-any
export function debounce<Fn extends (...args: any[]) => any>(
  fn: Fn,
  wait: number,
): DebouncedFunction<Fn> {
  let timeout: number | null = null;
  let flush: (() => void) | null = null;
  let pendingPromises: Resolver<ReturnType<Fn>>[] = [];

  const clear = () => {
    if (typeof timeout !== "number") return;
    clearTimeout(timeout);
    timeout = null;
    flush = null;
    pendingPromises = [];
  };

  flush = () => {
    flush?.();
  };

  return Object.assign(
    (...args) => {
      promise = new Promise((resolve, reject) => {
        debounced.clear();
        flush = async () => {
          debounced.clear();
          const clearablePromises = pendingPromises;
          pendingPromises = []
          const res = await fn.call(debounced, ...args);
          clearablePromises.forEach((resolver) => resolver(res));
        };
        timeout = Number(setTimeout(flush, wait));
      });
      pendingPromises.push(resolve);
      return promise
    },
    {
      get pending() {
        return typeof timeout === "number";
      }
    }
  ) as DebouncedFunction<Fn>;
}
