// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getLogger } from "./_get_logger.ts";
import { type GenericFunction } from "./logger.ts";

/** Log with debug level, using default logger. */
export function debug<T>(msg: () => T, ...args: unknown[]): T | undefined;
export function debug<T>(
  msg: T extends GenericFunction ? never : T,
  ...args: unknown[]
): T;
export function debug<T>(
  msg: (T extends GenericFunction ? never : T) | (() => T),
  ...args: unknown[]
): T | undefined {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").debug(msg, ...args);
  }
  return getLogger("default").debug(msg, ...args);
}
