// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
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
}

export class LoggerConfig {
  level?: LevelName;
  handlers?: string[];
}

export interface LogConfig {
  handlers?: {
    [name: string]: BaseHandler;
  };
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
   * assertEquals(record.loggerName, "example");
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
}

export interface LoggerOptions {
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

export class Logger {
  #level: LogLevel;
  handlers: BaseHandler[];
  readonly #loggerName: string;

  constructor(
    loggerName: string,
    levelName: LevelName,
    options: LoggerOptions = {},
  ) {
    this.#loggerName = loggerName;
    this.#level = getLevelByName(levelName);
    this.handlers = options.handlers ?? [];
  }

  /** Use this to retrieve the current numeric log level. */
  get level(): LogLevel {
    return this.#level;
  }

  /** Use this to set the numeric log level. */
  set level(level: LogLevel) {
    try {
      this.#level = getLevelByName(getLevelName(level));
    } catch (_) {
      throw new TypeError(`Invalid log level: ${level}`);
    }
  }

  get levelName(): LevelName {
    return getLevelName(this.#level);
  }
  set levelName(levelName: LevelName) {
    this.#level = getLevelByName(levelName);
  }

  get loggerName(): string {
    return this.#loggerName;
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
    });

    this.handlers.forEach((handler) => {
      handler.handle(record);
    });

    return msg instanceof Function ? fnResult : msg;
  }

  debug<T>(msg: () => T, ...args: unknown[]): T | undefined;
  debug<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  debug<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.DEBUG, msg, ...args);
  }

  info<T>(msg: () => T, ...args: unknown[]): T | undefined;
  info<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  info<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.INFO, msg, ...args);
  }

  warn<T>(msg: () => T, ...args: unknown[]): T | undefined;
  warn<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  warn<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.WARN, msg, ...args);
  }

  error<T>(msg: () => T, ...args: unknown[]): T | undefined;
  error<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  error<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.ERROR, msg, ...args);
  }

  critical<T>(msg: () => T, ...args: unknown[]): T | undefined;
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
