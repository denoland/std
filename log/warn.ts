// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { getLogger } from "./get_logger.ts";
import type { GenericFunction } from "./logger.ts";
import "./setup.ts";

export type { GenericFunction };

/**
 * Log at the warning level.
 *
 * This function is a pass-through to the default logger's `warn` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in yellow text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { warn } from "@std/log/warn";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(warn("This is a warning message."), "This is a warning message.");
 * // Prints: "WARN This is a warning message."
 *
 * assertEquals(warn(() => "This is a warning message."), "This is a warning message.");
 * // Prints: "WARN This is a warning message."
 * ```
 */
export function warn<T>(msg: () => T, ...args: unknown[]): T | undefined;
/**
 * Log at the warning level.
 *
 * This function is a pass-through to the default logger's `warn` method. By
 * default, the default logger is configured to use {@linkcode console.log}.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { warn } from "@std/log/warn";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(warn("This is a warning message."), "This is a warning message.");
 * // Prints: "WARN This is a warning message."
 *
 * assertEquals(warn(() => "This is a warning message."), "This is a warning message.");
 * // Prints: "WARN This is a warning message."
 * ```
 */
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
