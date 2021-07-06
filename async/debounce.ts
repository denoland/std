// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export interface Debounce<T extends Array<unknown>> {
  (...args: T): void;
  clear(): void;
  flush(): void;
  readonly pending: boolean;
}

/**
 * Creates a debounced function that delays the given func
 * by a given wait time in miliseconds. If the method is called
 * again before the timeout expires, the previous call will be
 * aborted.
 *
 * @param func The function to debounce.
 * @param wait The time in miliseconds to delay the function.
 */
// deno-lint-ignore no-explicit-any
export function debounce<T extends Array<any>>(
  func: (this: Debounce<T>, ...args: T) => void,
  wait = 100,
): Debounce<T> {
  let timeout: number | null = null;
  let debounced: null | (() => void) = null;

  const debounce: Debounce<T> = ((...args: T): void => {
    debounce.clear();
    debounced = (): void => {
      reset();
      func.call(debounce, ...args);
    };
    timeout = setTimeout(debounced, wait);
  }) as Debounce<T>;

  debounce.clear = (): void => {
    if (typeof timeout === "number") {
      clearTimeout(timeout);
      reset();
    }
  };

  debounce.flush = (): void => {
    if (debounced) {
      const debouncedFn = debounced;
      debounce.clear();
      debouncedFn();
    }
  };

  Object.defineProperty(debounce, "pending", {
    get: () => typeof timeout === "number",
  });

  function reset() {
    timeout = null;
    debounced = null;
  }

  return debounce;
}
