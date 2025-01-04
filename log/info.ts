// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { getLogger } from "./get_logger.ts";
import type { GenericFunction } from "./logger.ts";
import "./setup.ts";

/**
 * Log at the info level.
 *
 * This function is a pass-through to the default logger's `info` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in blue text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { info } from "@std/log/info";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(info("This is an info message."), "This is an info message.");
 * // Prints: "INFO This is an info message."
 *
 * assertEquals(info(() => "This is an info message."), "This is an info message.");
 * // Prints: "INFO This is an info message."
 * ```
 */
export function info<T>(msg: () => T, ...args: unknown[]): T | undefined;
/**
 * Log at the info level.
 *
 * This function is a pass-through to the default logger's `info` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in blue text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { info } from "@std/log/info";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(info("This is an info message."), "This is an info message.");
 * // Prints: "INFO This is an info message."
 *
 * assertEquals(info(() => "This is an info message."), "This is an info message.");
 * // Prints: "INFO This is an info message."
 * ```
 */
export function info<T>(
  msg: T extends GenericFunction ? never : T,
  ...args: unknown[]
): T;
export function info<T>(
  msg: (T extends GenericFunction ? never : T) | (() => T),
  ...args: unknown[]
): T | undefined {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").info(msg, ...args);
  }
  return getLogger("default").info(msg, ...args);
}
