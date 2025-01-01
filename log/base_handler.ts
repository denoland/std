// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import {
  getLevelByName,
  getLevelName,
  type LevelName,
  type LogLevel,
} from "./levels.ts";
import type { LogRecord } from "./logger.ts";

export type { LevelName, LogLevel, LogRecord };

/**
 * A function type that defines the structure of a formatter function.
 *
 * @param logRecord The log record that needs to be formatted.
 * @returns A string representation of the log record.
 */
export type FormatterFunction = (logRecord: LogRecord) => string;
const DEFAULT_FORMATTER: FormatterFunction = ({ levelName, msg }) =>
  `${levelName} ${msg}`;

/** Options for {@linkcode BaseHandler}. */
export interface BaseHandlerOptions {
  /** A function that formats log records. */
  formatter?: FormatterFunction;
}

/**
 * A base class for all log handlers.
 *
 * This class is abstract and should not be instantiated directly. Instead, it
 * should be extended by other classes that implement the `log` method.
 *
 * @example Usage
 * ```ts
 * import { BaseHandler } from "@std/log/base-handler";
 * import { assertInstanceOf } from "@std/assert/instance-of";
 *
 * class MyHandler extends BaseHandler {
 *   log(msg: string) {
 *     console.log(msg);
 *   }
 * }
 *
 * const handler = new MyHandler("INFO");
 * assertInstanceOf(handler, BaseHandler);
 * ```
 */
export abstract class BaseHandler {
  #levelName: LevelName;
  #level: LogLevel;
  /**
   * The function that formats log records.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * class MyHandler extends BaseHandler {
   *  log(msg: string) {
   *   console.log(msg);
   * }
   * }
   *
   * const handler = new MyHandler("INFO");
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   * const formatted = handler.formatter(record);
   * assertEquals(formatted, "INFO Hello, world!");
   * ```
   */
  formatter: FormatterFunction;

  /**
   * Constructs a new instance.
   *
   * @param levelName The name of the log level to handle.
   * @param options Options for the handler.
   */
  constructor(
    levelName: LevelName,
    options?: BaseHandlerOptions,
  ) {
    const { formatter = DEFAULT_FORMATTER } = options ?? {};
    this.#levelName = levelName;
    this.#level = getLevelByName(levelName);
    this.formatter = formatter;
  }

  /**
   * Getter for the log level that this handler will handle.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * assertEquals(handler.level, LogLevels.INFO);
   * ```
   *
   * @returns The log level to handle.
   */
  get level(): LogLevel {
    return this.#level;
  }

  /**
   * Setter for the log level that this handler will handle.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * handler.level = LogLevels.DEBUG;
   * assertEquals(handler.level, LogLevels.DEBUG);
   * ```
   *
   * @param level The log level to handle.
   */
  set level(level: LogLevel) {
    this.#level = level;
    this.#levelName = getLevelName(level);
  }

  /**
   * Getter for the name of the log level that this handler will handle.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { assertEquals } from "@std/assert/equals";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * assertEquals(handler.levelName, "INFO");
   * ```
   *
   * @returns The name of the log level to handle.
   */
  get levelName(): LevelName {
    return this.#levelName;
  }

  /**
   * Setter for the name of the log level that this handler will handle.
   *
   * @param levelName The name of the log level to handle.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { assertEquals } from "@std/assert/equals";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * handler.levelName = "DEBUG";
   * assertEquals(handler.levelName, "DEBUG");
   * ```
   */
  set levelName(levelName: LevelName) {
    this.#levelName = levelName;
    this.#level = getLevelByName(levelName);
  }

  /**
   * Handles a log record.
   *
   * @param logRecord The log record to handle.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   * handler.handle(record);
   *
   * assertInstanceOf(handler, BaseHandler);
   * ```
   */
  handle(logRecord: LogRecord) {
    if (this.level > logRecord.level) return;

    const msg = this.format(logRecord);
    this.log(msg);
  }

  /**
   * Formats a log record.
   *
   * @param logRecord The log record to format.
   * @returns A string representation of the log record.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   * const formatted = handler.format(record);
   * assertEquals(formatted, "INFO Hello, world!");
   * ```
   */
  format(logRecord: LogRecord): string {
    return this.formatter(logRecord);
  }

  /**
   * Logs a message.
   *
   * This method should be implemented by subclasses to handle the log record.
   *
   * @param msg The message to log.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * handler.log("Hello, world!"); // Prints "Hello, world!"
   *
   * assertInstanceOf(handler, BaseHandler);
   * ```
   */
  abstract log(msg: string): void;

  /**
   * Initializes the handler.
   *
   * This method is called when the handler is added to a logger. It can be
   * used to perform any setup that is required by the handler.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   *
   *   override setup() {
   *     console.log("Handler setup!");
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * handler.setup(); // Prints "Handler setup!"
   *
   * assertInstanceOf(handler, BaseHandler);
   * ```
   */
  setup() {}

  /**
   * Destroys the handler, performing any cleanup that is required.
   *
   * This method is called when the handler is removed from a logger. It can be
   * used to perform any cleanup that is required by the handler.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   *
   *   override destroy() {
   *     console.log("Handler destroyed!");
   *   }
   * }
   *
   * const handler = new MyHandler("INFO");
   * handler.destroy(); // Prints "Handler destroyed!"
   * assertInstanceOf(handler, BaseHandler);
   * ```
   */
  destroy() {}

  /**
   * Automatically disposes of the handler when instantiated with the `using`
   * keyword by calling the {@linkcode BaseHandler.destroy} method.
   *
   * @example Usage
   * ```ts
   * import { BaseHandler } from "@std/log/base-handler";
   * import { LogRecord } from "@std/log/logger";
   * import { assertInstanceOf } from "@std/assert/instance-of";
   *
   * class MyHandler extends BaseHandler {
   *   log(msg: string) {
   *     console.log(msg);
   *   }
   * }
   *
   * using handler = new MyHandler("INFO");
   * assertInstanceOf(handler, BaseHandler);
   * ```
   */
  [Symbol.dispose]() {
    this.destroy();
  }
}
