// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
/** Resolves after the given number of milliseconds. */
export function delay<T>(ms: number): Promise<T>;
export function delay<T>(ms: number, fn: () => T): Promise<T>;
export function delay<T>(ms: number, value: T): Promise<T>;
export function delay<T>(ms: number, arg?: any): Promise<T> {
  return typeof arg == "function"
    ? new Promise((res) => setTimeout(() => res(arg()), ms))
    : new Promise((res) => setTimeout(res, ms, arg));
}
