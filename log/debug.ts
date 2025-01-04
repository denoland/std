// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { getLogger } from "./get_logger.ts";
import type { GenericFunction } from "./logger.ts";
import "./setup.ts";

/**
 * Log at the debug level.
 *
 * This function is a pass-through to the default logger's `debug` method. By
 * default, this function is a no-op. To enable debug logging, set call
 * {@linkcode https://jsr.io/@std/log/doc/setup/~/setup | setup} and set the
 * default level to `DEBUG`.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage without setup
 * ```ts
 * import { debug } from "@std/log/debug";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(debug("This is a debug message."), "This is a debug message.");
 * // Prints: ""
 *
 * assertEquals(debug(() => "This is a debug message."), undefined);
 * // Prints: ""
 * ```
 *
 * @example Usage with setup
 * ```ts
 * import { ConsoleHandler, debug, setup } from "@std/log";
 * import { assertEquals } from "@std/assert/equals";
 *
 * setup({
 *   handlers: {
 *     default: new ConsoleHandler("DEBUG"),
 *   },
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["default"],
 *     },
 *   },
 * });
 *
 * assertEquals(debug("This is a debug message."), "This is a debug message.");
 *
 * assertEquals(
 *   debug(() => "This is a debug message."),
 *   "This is a debug message.",
 * );
 * ```
 */
export function debug<T>(msg: () => T, ...args: unknown[]): T | undefined;
/**
 * Log at the debug level.
 *
 * This function is a pass-through to the default logger's `debug` method. By
 * default, this function is a no-op. To enable debug logging, set call
 * {@linkcode https://jsr.io/@std/log/doc/setup/~/setup | setup} and set the
 * default level to `DEBUG`.
 *
 * @template T The type of the message to log.
 * @param msg The message to log.
 * @param args Arguments to be formatted into the message.
 * @returns The message that was logged.
 *
 * @example Usage without setup
 * ```ts
 * import { debug } from "@std/log/debug";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(debug("This is a debug message."), "This is a debug message.");
 * // Prints: ""
 *
 * assertEquals(debug(() => "This is a debug message."), undefined);
 * // Prints: ""
 * ```
 *
 * @example Usage with setup
 * ```ts
 * import { ConsoleHandler, debug, setup } from "@std/log";
 * import { assertEquals } from "@std/assert/equals";
 *
 * setup({
 *   handlers: {
 *     default: new ConsoleHandler("DEBUG"),
 *   },
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["default"],
 *     },
 *   },
 * });
 *
 * assertEquals(debug("This is a debug message."), "This is a debug message.");
 *
 * assertEquals(
 *   debug(() => "This is a debug message."),
 *   "This is a debug message.",
 * );
 * ```
 */
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
