// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { getLevelByName, getLevelName, LevelName, LogLevel } from "./levels.ts";
import type { LogRecord } from "./logger.ts";

export type FormatterFunction = (logRecord: LogRecord) => string;
const DEFAULT_FORMATTER: FormatterFunction = ({ levelName, msg }) =>
  `${levelName} ${msg}`;

export interface BaseHandlerOptions {
  formatter?: FormatterFunction;
}

export class BaseHandler {
  level: LogLevel;
  formatter: FormatterFunction;

  constructor(
    levelName: LevelName,
    { formatter = DEFAULT_FORMATTER }: BaseHandlerOptions = {},
  ) {
    this.level = getLevelByName(levelName);
    this.formatter = formatter;
  }

  get levelName() {
    return getLevelName(this.level);
  }
  set levelName(value: LevelName) {
    this.level = getLevelByName(value);
  }

  handle(logRecord: LogRecord) {
    if (this.level > logRecord.level) return;

    const msg = this.format(logRecord);
    this.log(msg);
  }

  format(logRecord: LogRecord): string {
    return this.formatter(logRecord);
  }

  log(_msg: string) {}
  setup() {}
  destroy() {}

  [Symbol.dispose]() {
    this.destroy();
  }
}
