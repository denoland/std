// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/* Resolves after the given number of milliseconds. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((res): void => {
    const done = () => {
      clearTimeout(i);
      signal?.removeEventListener("abort", done);
      res();
    };
    const i = setTimeout(done, ms);
    signal?.addEventListener("abort", done, { once: true });
  });
}
