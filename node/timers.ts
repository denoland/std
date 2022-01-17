// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// TODO(bartlomieju): implement the 'NodeJS.Timeout' and 'NodeJS.Immediate' versions of the timers.
// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/1163ead296d84e7a3c80d71e7c81ecbd1a130e9a/types/node/v12/globals.d.ts#L1120-L1131

// deno-lint-ignore-file no-explicit-any

// Deno's built-in timer functions throw "Illegal invocation" exceptions
// unless they are called with this == globalThis or this == null.

export function setTimeout(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...args: any[]
): number {
  return globalThis.setTimeout(handler, timeout, ...args);
}

export function clearTimeout(id: number): void {
  globalThis.clearTimeout(id);
}

export function setInterval(
  handler: (...args: any[]) => void,
  timeout?: number,
  ...args: any[]
): number {
  return globalThis.setInterval(handler, timeout, ...args);
}

export function clearInterval(id: number): void {
  globalThis.clearInterval(id);
}

export function setImmediate(
  handler: (...args: any[]) => void,
  ...args: any[]
): number {
  return globalThis.setTimeout(handler, 0, ...args);
}

export function clearImmediate(id: number): void {
  globalThis.clearTimeout(id);
}

export default {
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  setImmediate,
  clearImmediate,
};
