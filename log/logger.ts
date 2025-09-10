// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { getLevelByName, getLevelName, LogLevels } from "./levels.ts";
import type { LevelName, LogLevel } from "./levels.ts";
import type { BaseHandler } from "./base_handler.ts";

/** Any function that can be called with any arguments and return any value. */
// deno-lint-ignore no-explicit-any
export type GenericFunction = (...args: any[]) => any;

/**
 * Options for {@linkcode LogRecord}.
 */
export interface LogRecordOptions {
  /** The message to log. */
  msg: string;
  /** The arguments to log. */
  args: unknown[];
  /** The log level of the message. */
  level: LogLevel;
  /** The name of the logger that created the log record. */
  loggerName: string;
  /** The context data associated with the log record. */
  context?: Record<string, unknown>;
}

/**
 * Configuration options for a logger instance.
 *
 * @example Usage
 *
 * ```ts
 * import { ConsoleHandler, getLogger, setup, type LogConfig} from "@std/log";
 * import { assert } from "@std/assert";
 *
 * const handler = new ConsoleHandler("INFO");
 * const logConfig: LogConfig = {
 *     handlers: {
 *         default: handler,
 *     },
 *     loggers: {
 *         default: {
 *             level: "INFO",
 *             handlers: ["default"],
 *         },
 *     },
 * }
 * setup(logConfig);
 * const logger = getLogger();
 *
 * assert(logger.handlers.at(0) instanceof ConsoleHandler);
 * ```
 */
export class LoggerConfig {
  /** The minimum log level for the logger.
   *
   * @example Usage
   *
   * ```ts
   * import { ConsoleHandler, getLogger, setup, type LogConfig} from "@std/log";
   * import { assert } from "@std/assert";
   *
   * const handler = new ConsoleHandler("INFO");
   * const logConfig: LogConfig = {
   *     handlers: {
   *         default: handler,
   *     },
   *     loggers: {
   *         default: {
   *             level: "INFO",
   *             handlers: ["default"],
   *         },
   *     },
   * }
   * setup(logConfig);
   * const logger = getLogger();
   *
   * assert(logger.handlers.at(0) instanceof ConsoleHandler);
   * ```
   */
  level?: LevelName;
  /** A list of handler names attached to this logger.
   *
   * @example Usage
   *
   * ```ts
   * import { ConsoleHandler, getLogger, setup, type LogConfig} from "@std/log";
   * import { assert } from "@std/assert";
   *
   * const handler = new ConsoleHandler("INFO");
   * const logConfig: LogConfig = {
   *     handlers: {
   *         default: handler,
   *     },
   *     loggers: {
   *         default: {
   *             level: "INFO",
   *             handlers: ["default"],
   *         },
   *     },
   * }
   * setup(logConfig);
   * const logger = getLogger();
   *
   * assert(logger.handlers.at(0) instanceof ConsoleHandler);
   * ``` */
  handlers?: string[];
}

/**
 * Configuration for logger setup.
 */
export interface LogConfig {
  /** A dictionary of named handlers for logging. */
  handlers?: {
    [name: string]: BaseHandler;
  };
  /** A dictionary of named loggers and their configurations. */
  loggers?: {
    [name: string]: LoggerConfig;
  };
}

/**
 * An object that encapsulates provided message and arguments as well some
 * metadata that can be later used when formatting a message.
 *
 * @example Usage
 * ```ts
 * import { LogRecord } from "@std/log/logger";
 * import { LogLevels } from "@std/log/levels";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const record = new LogRecord({
 *   msg: "Hello, world!",
 *   args: ["foo", "bar"],
 *   level: LogLevels.INFO,
 *   loggerName: "example",
 * });
 *
 * assertEquals(record.msg, "Hello, world!");
 * assertEquals(record.args, ["foo", "bar"]);
 * assertEquals(record.level, LogLevels.INFO);
 * assertEquals(record.loggerName, "example");
 * ```
 */
export class LogRecord {
  /** The message to log.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   *
   * assertEquals(record.msg, "Hello, world!");
   * ```
   */
  readonly msg: string;
  #args: unknown[];
  #datetime: Date;
  #context: Record<string, unknown>;
  /**
   * The numeric log level of the log record.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   *
   * assertEquals(record.level, LogLevels.INFO);
   * ```
   */
  readonly level: number;
  /**
   * The name of the log level of the log record.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   *
   * assertEquals(record.levelName, "INFO");
   * ```
   */
  readonly levelName: string;
  /**
   * The name of the logger that created the log record.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   *
   * assertEquals(record.loggerName, "example");
   * ```
   */
  readonly loggerName: string;

  /**
   * Constructs a new instance.
   *
   * @param options The options to create a new log record.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   * ```
   */
  constructor(options: LogRecordOptions) {
    this.msg = options.msg;
    this.#args = [...options.args];
    this.level = options.level;
    this.loggerName = options.loggerName;
    this.#datetime = new Date();
    this.levelName = getLevelName(options.level);
    this.#context = { ...options.context };
  }

  /**
   * Getter for the arguments to log.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   *
   * assertEquals(record.args, ["foo", "bar"]);
   * ```
   *
   * @returns A copy of the arguments to log.
   */
  get args(): unknown[] {
    return [...this.#args];
  }

  /**
   * Getter for the date and time the log record was created.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertAlmostEquals } from "@std/assert/almost-equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   * });
   *
   * assertAlmostEquals(record.datetime.getTime(), Date.now(), 1);
   * ```
   *
   * @returns The date and time the log record was created.
   */
  get datetime(): Date {
    return new Date(this.#datetime.getTime());
  }

  /**
   * Getter for the context data associated with the log record.
   *
   * @example Usage
   * ```ts
   * import { LogRecord } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const record = new LogRecord({
   *   msg: "Hello, world!",
   *   args: ["foo", "bar"],
   *   level: LogLevels.INFO,
   *   loggerName: "example",
   *   context: { userId: "123", requestId: "abc" },
   * });
   *
   * assertEquals(record.context, { userId: "123", requestId: "abc" });
   * ```
   *
   * @returns A copy of the context data.
   */
  get context(): Record<string, unknown> {
    return { ...this.#context };
  }
}

/** Options for {@linkcode Logger}. */
export interface LoggerOptions {
  /** The handlers to use for the logger. */
  handlers?: BaseHandler[];
}

function asString(data: unknown, isProperty = false): string {
  if (typeof data === "string") {
    if (isProperty) return `"${data}"`;
    return data;
  } else if (
    data === null ||
    typeof data === "number" ||
    typeof data === "bigint" ||
    typeof data === "boolean" ||
    typeof data === "undefined" ||
    typeof data === "symbol"
  ) {
    return String(data);
  } else if (data instanceof Error) {
    return data.stack!;
  } else if (typeof data === "object") {
    return `{${
      Object.entries(data)
        .map(([k, v]) => `"${k}":${asString(v, true)}`)
        .join(",")
    }}`;
  }
  return "undefined";
}

/**
 * A logger that can log messages at different levels.
 *
 * @example Usage
 * ```ts
 * import { Logger } from "@std/log/logger";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const logger = new Logger("example", "INFO");
 * const result = logger.info("Hello, world!");
 *
 * assertEquals(result, "Hello, world!");
 * ```
 */
export class Logger {
  #context: Record<string, unknown>;
  #level: LogLevel;
  /**
   * The handlers to use for the logger.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { ConsoleHandler } from "@std/log/console-handler";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const handler = new ConsoleHandler("INFO");
   * const logger = new Logger("example", "INFO", {
   *  handlers: [handler],
   * });
   *
   * assertEquals(logger.handlers, [handler]);
   * ```
   */
  handlers: BaseHandler[];
  readonly #loggerName: string;

  /**
   * Constructs a new instance.
   *
   * @param loggerName The name of the logger.
   * @param levelName The name of the log level.
   * @param options The options to create a new logger.
   */
  constructor(
    loggerName: string,
    levelName: LevelName,
    options: LoggerOptions = {},
  ) {
    this.#loggerName = loggerName;
    this.#level = getLevelByName(levelName);
    this.handlers = options.handlers ?? [];
    this.#context = {};
  }

  /**
   * Getter for the log level.
   *
   * @returns The log level.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   * assertEquals(logger.level, LogLevels.INFO);
   * ```
   */
  get level(): LogLevel {
    return this.#level;
  }

  /**
   * Setter for the log level.
   *
   * @param level The log level to set.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   * logger.level = LogLevels.DEBUG;
   *
   * assertEquals(logger.level, LogLevels.DEBUG);
   * ```
   */
  set level(level: LogLevel) {
    try {
      this.#level = getLevelByName(getLevelName(level));
    } catch (_) {
      throw new TypeError(`Invalid log level: ${level}`);
    }
  }

  /**
   * Getter for the name of the log level.
   *
   * @returns The name of the log level.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   * assertEquals(logger.levelName, "INFO");
   * ```
   */
  get levelName(): LevelName {
    return getLevelName(this.#level);
  }

  /**
   * Setter for the name of the log level.
   *
   * @param levelName The name of the log level to set.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { LogLevels } from "@std/log/levels";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   * logger.levelName = "DEBUG";
   *
   * assertEquals(logger.level, LogLevels.DEBUG);
   * ```
   */
  set levelName(levelName: LevelName) {
    this.#level = getLevelByName(levelName);
  }

  /**
   * Getter for the name of the logger.
   *
   * @returns The name of the logger.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.loggerName, "example");
   * ```
   */
  get loggerName(): string {
    return this.#loggerName;
  }

  /**
   * Adds a key-value pair to the logger context. This context data will be
   * included in all log records generated by this logger instance.
   *
   * @param key The context key.
   * @param value The context value.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   *
   * const logger = new Logger("example", "INFO");
   * logger.addContext("userId", "12345");
   * logger.addContext("requestId", "abc-def-ghi");
   * ```
   */
  addContext(key: string, value: unknown): void {
    this.#context[key] = value;
  }

  /**
   * Removes a key-value pair from the logger context.
   *
   * @param key The context key to remove.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   *
   * const logger = new Logger("example", "INFO");
   * logger.addContext("userId", "12345");
   * logger.removeContext("userId");
   * ```
   */
  removeContext(key: string): void {
    delete this.#context[key];
  }

  /**
   * Clears all context data from the logger.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   *
   * const logger = new Logger("example", "INFO");
   * logger.addContext("userId", "12345");
   * logger.addContext("requestId", "abc-def-ghi");
   * logger.clearContext();
   * ```
   */
  clearContext(): void {
    this.#context = {};
  }

  /**
   * Gets a copy of the current context data.
   *
   * @returns A copy of the context data.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   * logger.addContext("userId", "12345");
   *
   * assertEquals(logger.getContext(), { userId: "12345" });
   * ```
   */
  getContext(): Record<string, unknown> {
    return { ...this.#context };
  }

  /**
   * If the level of the logger is greater than the level to log, then nothing
   * is logged, otherwise a log record is passed to each log handler.  `msg` data
   * passed in is returned.  If a function is passed in, it is only evaluated
   * if the msg will be logged and the return value will be the result of the
   * function, not the function itself, unless the function isn't called, in which
   * case undefined is returned.  All types are coerced to strings for logging.
   */
  #log<T>(
    level: LogLevel,
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    if (this.level > level) {
      return msg instanceof Function ? undefined : msg;
    }

    let fnResult: T | undefined;
    let logMessage: string;
    if (msg instanceof Function) {
      fnResult = msg();
      logMessage = asString(fnResult);
    } else {
      logMessage = asString(msg);
    }
    const record: LogRecord = new LogRecord({
      msg: logMessage,
      args: args,
      level: level,
      loggerName: this.loggerName,
      context: this.#context,
    });

    this.handlers.forEach((handler) => {
      handler.handle(record);
    });

    return msg instanceof Function ? fnResult : msg;
  }

  /**
   * Log at the debug level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.debug("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.debug(() => "Hello, world!"), undefined);
   * ```
   */
  debug<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /**
   * Log at the debug level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.debug("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.debug(() => "Hello, world!"), undefined);
   * ```
   */
  debug<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  debug<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.DEBUG, msg, ...args);
  }

  /**
   * Log at the info level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.info("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.info(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  info<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /**
   * Log at the info level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.info("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.info(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  info<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  info<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.INFO, msg, ...args);
  }

  /**
   * Log at the warning level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.warn("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.warn(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  warn<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /**
   * Log at the warning level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.warn("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.warn(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  warn<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  warn<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.WARN, msg, ...args);
  }

  /**
   * Log at the error level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.error("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.error(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  error<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /**
   * Log at the error level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.error("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.error(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  error<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  error<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.ERROR, msg, ...args);
  }

  /**
   * Log at the critical level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.critical("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.critical(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  critical<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /**
   * Log at the critical level.
   *
   * @template T The type of the message to log.
   * @param msg The message to log.
   * @param args Arguments to be formatted into the message.
   * @returns The message that was logged.
   *
   * @example Usage
   * ```ts
   * import { Logger } from "@std/log/logger";
   * import { assertEquals } from "@std/assert/equals";
   *
   * const logger = new Logger("example", "INFO");
   *
   * assertEquals(logger.critical("Hello, world!"), "Hello, world!");
   *
   * assertEquals(logger.critical(() => "Hello, world!"), "Hello, world!");
   * ```
   */
  critical<T>(
    msg: T extends GenericFunction ? never : T,
    ...args: unknown[]
  ): T;
  critical<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.CRITICAL, msg, ...args);
  }
}
