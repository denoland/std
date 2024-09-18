// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { type LevelName, LogLevels } from "./levels.ts";
import type { LogRecord } from "./logger.ts";
import { blue, bold, red, yellow } from "@std/fmt/colors";
import { BaseHandler, type BaseHandlerOptions } from "./base_handler.ts";

/** The options for {@linkcode ConsoleHandler} */
export interface ConsoleHandlerOptions extends BaseHandlerOptions {
  /** Colors are used when true
   *
   * @default {true}
   */
  useColors?: boolean;
}

/**
 * This is the default logger. It will output color coded log messages to the
 * console via `console.log()`.
 */
export class ConsoleHandler extends BaseHandler {
  #useColors?: boolean;

  /** Construct a {@linkcode ConsoleHandler} */
  constructor(levelName: LevelName, options: ConsoleHandlerOptions = {}) {
    super(levelName, options);
    this.#useColors = options.useColors ?? true;
  }

  /** Formats the log record */
  override format(logRecord: LogRecord): string {
    let msg = super.format(logRecord);

    if (this.#useColors) {
      msg = this.applyColors(msg, logRecord.level);
    }

    return msg;
  }

  /** Applies the color */
  applyColors(msg: string, level: number): string {
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

  /** Logs the message */
  log(msg: string) {
    // deno-lint-ignore no-console
    console.log(msg);
  }
}
