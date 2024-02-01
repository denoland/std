// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { getLogger } from "./_get_logger.ts";
import { type GenericFunction } from "./logger.ts";

/** Log with warning level, using default logger. */
export function warn<T>(msg: () => T, ...args: unknown[]): T | undefined;
export function warn<T>(
  msg: T extends GenericFunction ? never : T,
  ...args: unknown[]
): T;
export function warn<T>(
  msg: (T extends GenericFunction ? never : T) | (() => T),
  ...args: unknown[]
): T | undefined {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").warn(msg, ...args);
  }
  return getLogger("default").warn(msg, ...args);
}

/**
 * @deprecated (will be removed after 0.214.0) Use {@linkcode warn} instead.
 *
 * Log with warning level, using default logger.
 */
export function warning<T>(msg: () => T, ...args: unknown[]): T | undefined;
/**
 * @deprecated (will be removed after 0.214.0) Use {@linkcode warn} instead.
 *
 * Log with warning level, using default logger.
 */
export function warning<T>(
  msg: T extends GenericFunction ? never : T,
  ...args: unknown[]
): T;
export function warning<T>(
  msg: (T extends GenericFunction ? never : T) | (() => T),
  ...args: unknown[]
): T | undefined {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return warn(msg, ...args);
  }
  return warn(msg, ...args);
}