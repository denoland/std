// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import {
  getLevelByName,
  getLevelName,
  type LevelName,
  type LogLevel,
} from "./levels.ts";
import type { LogRecord } from "./logger.ts";

/** The formatter function */
export type FormatterFunction = (logRecord: LogRecord) => string;
const DEFAULT_FORMATTER: FormatterFunction = ({ levelName, msg }) =>
  `${levelName} ${msg}`;

/** The options of {@linkcode BaseHandler} */
export interface BaseHandlerOptions {
  /** The log formatters */
  formatter?: FormatterFunction;
}

/** The base class of handlers */
export abstract class BaseHandler {
  #levelName: LevelName;
  #level: LogLevel;
  /** The log formatters */
  formatter: FormatterFunction;

  /** Constructs a new instance. */
  constructor(
    levelName: LevelName,
    options?: BaseHandlerOptions,
  ) {
    const { formatter = DEFAULT_FORMATTER } = options ?? {};
    this.#levelName = levelName;
    this.#level = getLevelByName(levelName);
    this.formatter = formatter;
  }

  /** Gets the log level */
  get level(): LogLevel {
    return this.#level;
  }

  /** Sets the log level */
  set level(level: LogLevel) {
    this.#level = level;
    this.#levelName = getLevelName(level);
  }

  /** Gets the name of log level */
  get levelName(): LevelName {
    return this.#levelName;
  }
  /** Sets the log level by the name */
  set levelName(levelName: LevelName) {
    this.#levelName = levelName;
    this.#level = getLevelByName(levelName);
  }

  /** Handles the log record */
  handle(logRecord: LogRecord) {
    if (this.level > logRecord.level) return;

    const msg = this.format(logRecord);
    this.log(msg);
  }

  /** Formats the log record */
  format(logRecord: LogRecord): string {
    return this.formatter(logRecord);
  }

  /** Logs the message */
  abstract log(msg: string): void;
  /** Sets up the logger */
  setup() {}
  /** Destroys the resources */
  destroy() {}

  /** Disposes the resources */
  [Symbol.dispose]() {
    this.destroy();
  }
}
