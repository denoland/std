// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { getLevelByName, getLevelName, LogLevels } from "./levels.ts";
import type { LevelName, LogLevel } from "./levels.ts";
import type { BaseHandler } from "./base_handler.ts";

/** Any function that can be called with any arguments and return any value. */
// deno-lint-ignore no-explicit-any
export type GenericFunction = (...args: any[]) => any;

/** The option for {@linkcode LogRecord} */
export interface LogRecordOptions {
  /** The log message */
  msg: string;
  /** The log arguments */
  args: unknown[];
  /** The log level */
  level: LogLevel;
  /** The logger name */
  loggerName: string;
}

/** The config for {@linkcode Logger} */
export class LoggerConfig {
  /** The log level name */
  level?: LevelName;
  /** The log handlers */
  handlers?: string[];
}

/** The config for setting up the loggers and handlers */
export interface LogConfig {
  /** The log handlers */
  handlers?: {
    [name: string]: BaseHandler;
  };
  /** The loggers */
  loggers?: {
    [name: string]: LoggerConfig;
  };
}

/**
 * An object that encapsulates provided message and arguments as well some
 * metadata that can be later used when formatting a message.
 */
export class LogRecord {
  /** The log message */
  readonly msg: string;
  #args: unknown[];
  #datetime: Date;
  /** The log level */
  readonly level: number;
  /** The log level name */
  readonly levelName: string;
  /** The logger name */
  readonly loggerName: string;

  /**
   * Construct a new LogRecord object with the provided options.
   */
  constructor(options: LogRecordOptions) {
    this.msg = options.msg;
    this.#args = [...options.args];
    this.level = options.level;
    this.loggerName = options.loggerName;
    this.#datetime = new Date();
    this.levelName = getLevelName(options.level);
  }
  /** The log arguments */
  get args(): unknown[] {
    return [...this.#args];
  }
  /** The log datetime */
  get datetime(): Date {
    return new Date(this.#datetime.getTime());
  }
}

/** The options for {@linkcode Logger} */
export interface LoggerOptions {
  /** The log handlers */
  handlers?: BaseHandler[];
}

/** The logger */
export class Logger {
  #level: LogLevel;
  /** The log handlers */
  handlers: BaseHandler[];
  readonly #loggerName: string;

  /**
   * Construct a new Logger object with the provided options.
   */
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

  /** Gets the log level name */
  get levelName(): LevelName {
    return getLevelName(this.#level);
  }
  /** Sets the log level by the name */
  set levelName(levelName: LevelName) {
    this.#level = getLevelByName(levelName);
  }

  /** Gets the logger name */
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
      logMessage = this.asString(fnResult);
    } else {
      logMessage = this.asString(msg);
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

  /** Returns the string representation of the given data */
  asString(data: unknown, isProperty = false): string {
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
          .map(([k, v]) => `"${k}":${this.asString(v, true)}`)
          .join(",")
      }}`;
    }
    return "undefined";
  }

  /** Log message with the debug level */
  debug<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /** Log message with the debug level */
  debug<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  debug<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.DEBUG, msg, ...args);
  }

  /** Log message with the info level */
  info<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /** Log message with the info level */
  info<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  info<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.INFO, msg, ...args);
  }

  /** Log message with the warning level */
  warn<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /** Log message with the warning level */
  warn<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  warn<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.WARN, msg, ...args);
  }

  /** Log message with the error level */
  error<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /** Log message with the error level */
  error<T>(msg: T extends GenericFunction ? never : T, ...args: unknown[]): T;
  error<T>(
    msg: (T extends GenericFunction ? never : T) | (() => T),
    ...args: unknown[]
  ): T | undefined {
    return this.#log(LogLevels.ERROR, msg, ...args);
  }

  /** Log message with the critical level */
  critical<T>(msg: () => T, ...args: unknown[]): T | undefined;
  /** Log message with the critical level */
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
