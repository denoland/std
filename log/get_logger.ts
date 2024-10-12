// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { Logger } from "./logger.ts";
import { state } from "./_state.ts";
import { DEFAULT_LEVEL } from "./_config.ts";

export type { Logger };

/**
 * Get a logger instance. If not specified `name`, get the default logger.
 *
 * @param name The name of the logger.
 * @returns The logger instance.
 *
 * @example Usage (without defined name and minimal setup)
 * ```ts
 * import { getLogger } from "@std/log/get-logger";
 * import "@std/log/setup";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const logger = getLogger();
 * const result = logger.info("Hello world!"); // Prints "INFO Hello world!" in blue
 *
 * assertEquals(result, "Hello world!");
 * ```
 *
 * @example Usage (without defined name and custom setup)
 * ```ts
 * import { getLogger } from "@std/log/get-logger";
 * import { ConsoleHandler } from "@std/log/console-handler";
 * import { setup } from "@std/log/setup";
 * import { assertEquals } from "@std/assert/equals";
 *
 * setup({
 *   handlers: {
 *     console: new ConsoleHandler("DEBUG"),
 *   },
 *   loggers: {
 *     default: {
 *       level: "DEBUG",
 *       handlers: ["console"],
 *     },
 *   },
 * });
 *
 * const logger = getLogger();
 *
 * const result = logger.info("Hello world!"); // Prints "INFO Hello world!" in blue
 *
 * assertEquals(result, "Hello world!");
 * ```
 *
 * @example Usage (with defined name)
 * ```ts
 * import { getLogger } from "@std/log/get-logger";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const logger = getLogger("my-logger");
 * const result = logger.info("Hello world!");
 *
 * assertEquals(result, "Hello world!");
 * ```
 */
export function getLogger(name?: string): Logger {
  if (!name) {
    const d = state.loggers.get("default");
    if (d === undefined) {
      throw new Error(
        `"default" logger must be set for getting logger without name`,
      );
    }
    return d;
  }
  const result = state.loggers.get(name);
  if (!result) {
    const logger = new Logger(name, DEFAULT_LEVEL, { handlers: [] });
    state.loggers.set(name, logger);
    return logger;
  }
  return result;
}
