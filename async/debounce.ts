// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

type DebouncableFunc = (...args: any[]) => void | Promise<void>;

/**
 * A debounced function that will be delayed by a given `wait`
 * time in milliseconds. If the method is called again before
 * the timeout expires, the previous call will be aborted.
 */
// deno-lint-ignore no-explicit-any
export interface DebouncedFunction<T extends DebouncableFunc> {
  T;
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
 * @typeParam T The provided function.
 * @param fn The function to debounce.
 * @param wait The time in milliseconds to delay the function.
 * @returns The debounced function.
 */
// deno-lint-ignore no-explicit-any
export function debounce<T extends DebouncableFunc>(
  fn: T,
  wait: number,
): DebouncedFunction<T> {
  let timeout: number | null = null;
  let flush: (() => void) | null = null;

  const debounced: DebouncedFunction<T> = ((...args) => {
    debounced.clear();
    flush = () => {
      debounced.clear();
      fn(...args);
    };
    timeout = Number(setTimeout(flush, wait));
  }) as DebouncedFunction<T>;

  debounced.clear = () => {
    if (typeof timeout === "number") {
      clearTimeout(timeout);
      timeout = null;
      flush = null;
    }
  };

  debounced.flush = () => {
    flush?.();
  };

  Object.defineProperty(debounced, "pending", {
    get: () => typeof timeout === "number",
  });

  return debounced;
}

/**
 * Creates a debounced async function that delays the given `func`
 * by a given `wait` time in milliseconds. If the method is called
 * again before the timeout expires, the previous call is aborted.
 *
 * @example Usage
 * ```ts ignore
 * import { debounceAsync } from "@std/async/debounce";
 *
 * const submitSearch = debounceAsync(
 *   (term: string) => {
 *     const req = await fetch(`https://api.github.com/search/issues?q=${term}`);
 *     return await req.json();
 *   },
 *   200,
 * );
 *
 * let promise: ReturnType<submitSearch> | undefined:
 * const [promise] = ['d', 'de', 'den', 'deno'].map((query) => {
 *   promise = submitSearch(query);
 *   await delay(5);
 * });
 * const result = await promise;
 * // wait 200ms ...
 * // output: Function debounced after 200ms with result of 'deno' query
 * ```
 *
 * @typeParam F The function to debounce.
 * @param fn The function to debounce.
 * @param wait The time in milliseconds to delay the function.
 * @returns The debounced function.
 */
export function debounceAsync<F extends (...a: any[]) => Promise<any>>(fn: F, wait: number): F {
  let timeout: number | undefined;
  let pendingPromiseTuple: PromiseWithResolvers<ReturnType<F>> | undefined;

  const clear = () => {
    if (typeof timeout !== 'number') return;
    clearTimeout(timeout);
    timeout = undefined;
  };

  return ((...args) => {
    const p = pendingPromiseTuple ?? Promise.withResolvers();
    pendingPromiseTuple = p;
    const { promise, resolve, reject } = pendingPromiseTuple;
    clear();
    const flush = async () => {
      clear();
      pendingPromiseTuple = undefined;
      try {
        const res = await fn(...args);
        resolve(res);
      } catch (error) {
        reject(error);
      }
    };
    timeout = Number(setTimeout(flush, wait));
    return promise;
  }) as F;
}
