// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { type LevelName, LogLevels } from "./levels.ts";
import type { LogRecord } from "./logger.ts";
import { blue, bold, red, yellow } from "@std/fmt/colors";
import { BaseHandler, type BaseHandlerOptions } from "./base_handler.ts";

/** Options for {@linkcode ConsoleHandler}. */
export interface ConsoleHandlerOptions extends BaseHandlerOptions {
  /**
   * Whether to use colors in the output.
   *
   * @default {true}
   */
  useColors?: boolean;
}

function applyColors(msg: string, level: number): string {
  switch (level) {
    case LogLevels.INFO:
      msg = blue(msg);
      break;
    case LogLevels.WARN:
      msg = yellow(msg);
      break;
    case LogLevels.ERROR:
      msg = red(msg);
      break;
    case LogLevels.CRITICAL:
      msg = bold(red(msg));
      break;
    default:
      break;
  }

  return msg;
}

/**
 * Default logger that outputs log messages to the console via
 * {@linkcode console.log}.
 *
 * @example Usage
 * ```ts no-assert
 * import { ConsoleHandler } from "@std/log/console-handler";
 *
 * const handler = new ConsoleHandler("INFO");
 * handler.log("Hello, world!"); // Prints "Hello, world!"
 * ```
 */
export class ConsoleHandler extends BaseHandler {
  #useColors?: boolean;

  /**
   * Constructs a new instance.
   *
   * @param levelName The level name to log messages at.
   * @param options Options for the handler.
   */
  constructor(levelName: LevelName, options: ConsoleHandlerOptions = {}) {
    super(levelName, options);
    this.#useColors = options.useColors ?? true;
  }

  /**
   * Formats a log record into a string.
   *
   * @example Usage
   * ```ts
   * import { ConsoleHandler } from "@std/log/console-handler";
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   * import { blue } from "@std/fmt/colors";
   *
   * const handler = new ConsoleHandler("INFO");
   * const logRecord = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "my-logger",
   * });
   * const result = handler.format(logRecord);
   *
   * assertEquals(result, blue("INFO Hello, world!"));
   * ```
   *
   * @param logRecord The log record to format.
   * @returns The formatted log record.
   */
  override format(logRecord: LogRecord): string {
    let msg = super.format(logRecord);

    if (this.#useColors) {
      msg = applyColors(msg, logRecord.level);
    }

    return msg;
  }

  /**
   * Logs a message to the console.
   *
   * @example Usage
   * ```ts no-assert
   * import { ConsoleHandler } from "@std/log/console-handler";
   *
   * const handler = new ConsoleHandler("INFO");
   * handler.log("Hello, world!"); // Prints "Hello, world!"
   * ```
   *
   * @param msg The message to log.
   */
  log(msg: string) {
    // deno-lint-ignore no-console
    console.log(msg);
  }
}
