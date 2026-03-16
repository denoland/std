// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A debounced function that will be delayed by a given `wait`
 * time in milliseconds. If the method is called again before
 * the timeout expires, the previous call will be aborted.
 */
export interface DebouncedFunction<T extends Array<unknown>> {
  (...args: T): void;
  /** Clears the debounce timeout and omits calling the debounced function. */
  clear(): void;
  /** Clears the debounce timeout and calls the debounced function immediately. */
  flush(): void;
  /** Returns a boolean whether a debounce call is pending or not. */
  readonly pending: boolean;
}

/** Options for {@linkcode debounce}. */
export interface DebounceOptions {
  /** An AbortSignal that clears the debounce timeout when aborted. */
  signal?: AbortSignal | undefined;
}

/**
 * Creates a debounced function that delays the given `func`
 * by a given `wait` time in milliseconds. If the method is called
 * again before the timeout expires, the previous call will be
 * aborted.
 *
 * If an {@linkcode AbortSignal} is provided via `options.signal`, aborting the
 * signal clears any pending debounce timeout, equivalent to calling
 * {@linkcode DebouncedFunction.clear}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts ignore
 * import { debounce } from "@std/async/unstable-debounce";
 *
 * const controller = new AbortController();
 * const log = debounce(
 *   (event: Deno.FsEvent) =>
 *     console.log("[%s] %s", event.kind, event.paths[0]),
 *   200,
 *   { signal: controller.signal },
 * );
 *
 * for await (const event of Deno.watchFs("./")) {
 *   log(event);
 * }
 *
 * // Abort clears any pending debounce
 * controller.abort();
 * ```
 *
 * @typeParam T The arguments of the provided function.
 * @param fn The function to debounce.
 * @param wait The time in milliseconds to delay the function.
 * @param options Optional parameters.
 * @returns The debounced function.
 */
// deno-lint-ignore no-explicit-any
export function debounce<T extends Array<any>>(
  fn: (this: DebouncedFunction<T>, ...args: T) => void,
  wait: number,
  options?: DebounceOptions,
): DebouncedFunction<T> {
  let timeout: number | null = null;
  let flush: (() => void) | null = null;

  const debounced: DebouncedFunction<T> = ((...args: T) => {
    debounced.clear();
    flush = () => {
      debounced.clear();
      fn.call(debounced, ...args);
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

  const signal = options?.signal;
  if (signal) {
    signal.throwIfAborted();
    signal.addEventListener("abort", () => debounced.clear(), { once: true });
  }

  return debounced;
}
