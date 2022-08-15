// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

export interface DelayOptions {
  signal?: AbortSignal;
  /** Defines if the timer should be non-blocking. This is `false` by default. */
  unref?: boolean;
}

/* Resolves after the given number of milliseconds. */
export function delay(ms: number, options: DelayOptions = {}): Promise<void> {
  const { signal, unref } = options;
  if (signal?.aborted) {
    return Promise.reject(new DOMException("Delay was aborted.", "AbortError"));
  }
  return new Promise((resolve, reject): void => {
    const abort = () => {
      clearTimeout(i);
      reject(new DOMException("Delay was aborted.", "AbortError"));
    };
    const done = () => {
      signal?.removeEventListener("abort", abort);
      resolve();
    };
    const i = setTimeout(done, ms);
    signal?.addEventListener("abort", abort, { once: true });
    if (unref) {
      Deno.unrefTimer(i);
    }
  });
}
