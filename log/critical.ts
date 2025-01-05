// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { getLogger } from "./get_logger.ts";
import type { GenericFunction } from "./logger.ts";
import "./setup.ts";

/**
 * Log at the critical level.
 *
 * This function is a pass-through to the default logger's `critical` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in bold red text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { critical } from "@std/log/critical";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(critical("This is a critical message."), "This is a critical message.");
 * // Prints: "CRITICAL This is a critical message."
 *
 * assertEquals(critical(() => "This is a critical message."), "This is a critical message.");
 * // Prints: "CRITICAL This is a critical message."
 * ```
 */
export function critical<T>(msg: () => T, ...args: unknown[]): T | undefined;
/**
 * Log at the critical level.
 *
 * This function is a pass-through to the default logger's `critical` method. By
 * default, the default logger is configured to use {@linkcode console.log} and
 * print in bold red text.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage
 * ```ts
 * import { critical } from "@std/log/critical";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(critical("This is a critical message."), "This is a critical message.");
 * // Prints: "CRITICAL This is a critical message."
 *
 * assertEquals(critical(() => "This is a critical message."), "This is a critical message.");
 * // Prints: "CRITICAL This is a critical message."
 * ```
 */
export function critical<T>(
  msg: T extends GenericFunction ? never : T,
  ...args: unknown[]
): T;
export function critical<T>(
  msg: (T extends GenericFunction ? never : T) | (() => T),
  ...args: unknown[]
): T | undefined {
  // Assist TS compiler with pass-through generic type
  if (msg instanceof Function) {
    return getLogger("default").critical(msg, ...args);
  }
  return getLogger("default").critical(msg, ...args);
}
