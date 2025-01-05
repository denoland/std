// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { getLogger } from "./get_logger.ts";
import type { GenericFunction } from "./logger.ts";
import "./setup.ts";

/**
 * Log at the error level.
 *
 * This function is a pass-through to the default logger's `error` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in red text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { error } from "@std/log/error";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(error("This is an error message."), "This is an error message.");
 * // Prints: "ERROR This is an error message."
 *
 * assertEquals(error(() => "This is an error message."), "This is an error message.");
 * // Prints: "ERROR This is an error message."
 * ```
 */
export function error<T>(msg: () => T, ...args: unknown[]): T | undefined;
/**
 * Log at the error level.
 *
 * This function is a pass-through to the default logger's `error` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in red text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { error } from "@std/log/error";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(error("This is an error message."), "This is an error message.");
 * // Prints: "ERROR This is an error message."
 *
 * assertEquals(error(() => "This is an error message."), "This is an error message.");
 * // Prints: "ERROR This is an error message."
 * ```
 */
export function error<T>(
  msg: T extends GenericFunction ? never : T,
  ...args: unknown[]
): T;
export function error<T>(
  msg: (T extends GenericFunction ? never : T) | (() => T),
  ...args: unknown[]
): T | undefined {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").error(msg, ...args);
  }
  return getLogger("default").error(msg, ...args);
}
