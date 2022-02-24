// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { Timeout, TIMEOUT_MAX } from "./internal/timers.mjs";
import { validateCallback } from "./internal/validators.mjs";
const setTimeout_ = globalThis.setTimeout;
const clearTimeout_ = globalThis.clearTimeout;
const setInterval_ = globalThis.setInterval;
const clearInterval_ = globalThis.clearInterval;
export function setTimeout(
  cb: (...args: unknown[]) => void,
  timeout?: number,
  ...args: unknown[]
) {
  validateCallback(cb);
  if (typeof timeout === "number" && timeout > TIMEOUT_MAX) {
    timeout = 1;
  }
  const timer = new Timeout(setTimeout_(
    (...args: unknown[]) => {
      cb.bind(timer)(...args);
    },
    timeout,
    ...args,
  ));
  return timer;
}
export function setUnrefTimeout(
  cb: (...args: unknown[]) => void,
  timeout?: number,
  ...args: unknown[]
) {
  setTimeout(cb, timeout, ...args).unref();
}
export function clearTimeout(timeout?: Timeout | number) {
  if (timeout == null) {
    return;
  }
  clearTimeout_(+timeout);
}
export function setInterval(
  cb: (...args: unknown[]) => void,
  timeout?: number,
  ...args: unknown[]
) {
  validateCallback(cb);
  if (typeof timeout === "number" && timeout > TIMEOUT_MAX) {
    timeout = 1;
  }
  const timer = new Timeout(setInterval_(
    (...args: unknown[]) => {
      cb.bind(timer)(...args);
    },
    timeout,
    ...args,
  ));
  return timer;
}
export function clearInterval(timeout?: Timeout | number | string) {
  if (timeout == null) {
    return;
  }
  clearInterval_(+timeout);
}
// TODO(bartlomieju): implement the 'NodeJS.Immediate' versions of the timers.
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/1163ead296d84e7a3c80d71e7c81ecbd1a130e9a/types/node/v12/globals.d.ts#L1120-L1131
export const setImmediate = (
  cb: (...args: unknown[]) => void,
  ...args: unknown[]
): Timeout => setTimeout(cb, 0, ...args);
export const clearImmediate = clearTimeout;

export default {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
};
