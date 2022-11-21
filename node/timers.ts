// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { setUnrefTimeout, Timeout, TIMEOUT_MAX } from "./internal/timers.mjs";
import { validateFunction } from "./internal/validators.mjs";
import { promisify } from "./internal/util.mjs";
export { setUnrefTimeout } from "./internal/timers.mjs";

const setTimeout_ = globalThis.setTimeout;
const clearTimeout_ = globalThis.clearTimeout;
const setInterval_ = globalThis.setInterval;
const clearInterval_ = globalThis.clearInterval;

export function setTimeout(
  cb: (...args: unknown[]) => void,
  timeout?: number,
  ...args: unknown[]
) {
  validateFunction(cb, "callback");
  if (typeof timeout === "number" && timeout > TIMEOUT_MAX) {
    timeout = 1;
  }
  const callback = (...args: unknown[]) => {
    cb.bind(timer)(...args);
  };
  const timer = new Timeout(
    setTimeout_(callback, timeout, ...args),
    callback,
    timeout,
    args,
    false,
  );
  return timer;
}

Object.defineProperty(setTimeout, promisify.custom, {
  value: (timeout: number, ...args: unknown[]) => {
    return new Promise((cb) => setTimeout(cb, timeout, ...args));
  },
  enumerable: true,
});
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
  validateFunction(cb, "callback");
  if (typeof timeout === "number" && timeout > TIMEOUT_MAX) {
    timeout = 1;
  }
  const callback = (...args: unknown[]) => {
    cb.bind(timer)(...args);
  };
  const timer = new Timeout(
    setInterval_(callback, timeout, ...args),
    callback,
    timeout,
    args,
    true,
  );
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
  setUnrefTimeout,
  clearImmediate,
};
