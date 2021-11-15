// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// FIXME(bartlomieju): currently this implementation is buggy
// See:
// - https://github.com/denoland/deno_std/issues/1482
// - https://github.com/denoland/deno/issues/12735

/** https://nodejs.org/api/process.html#process_process_nexttick_callback_args */
export function nextTick(this: unknown, cb: () => void): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  cb: (...args: T) => void,
  ...args: T
): void;
export function nextTick<T extends Array<unknown>>(
  this: unknown,
  cb: (...args: T) => void,
  ...args: T
) {
  if (args) {
    queueMicrotask(() => cb.call(this, ...args));
  } else {
    queueMicrotask(cb);
  }
}
