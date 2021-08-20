import { Handler } from "./handlers.ts";
import { LogLevel, logLevels } from "./levels.ts";

export function asString(data: unknown): string {
  if (typeof data === "string") {
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
  } else if (typeof data === "object") {
    return JSON.stringify(data);
  }
  return "undefined";
}

const DEFAULT_LOGGER_NAME = "logger";

export type LogRecord<M = unknown> = Readonly<{
  message: M;
  args: ReadonlyArray<unknown>;
  datetime: Date;
  logLevel: LogLevel;
  logger: Logger;
}>;

export class Logger<M = unknown> {
  name: string;
  logLevel: LogLevel;
  handlers: Handler[];

  constructor(logLevel: LogLevel, {
    name = DEFAULT_LOGGER_NAME,
    handlers = [],
  }: {
    name?: string;
    handlers?: Handler[];
  } = {}) {
    this.name = name;
    this.logLevel = logLevel;
    this.handlers = handlers;
  }

  protected dispatch(logLevel: LogLevel, message: unknown, ...args: unknown[]) {
    if (this.logLevel.code > logLevel.code) return;

    if (message instanceof Function) {
      message = message(logLevel);
    }

    message = asString(message);

    const record: LogRecord<unknown> = {
      datetime: new Date(),
      logger: this,
      message,
      args,
      logLevel,
    };

    this.handlers.forEach((handler) => handler.handle(record));
  }

  trace(message: M, ...args: unknown[]) {
    return this.dispatch(logLevels.trace, message, ...args);
  }
  debug(message: M, ...args: unknown[]) {
    return this.dispatch(logLevels.debug, message, ...args);
  }
  info(message: M, ...args: unknown[]) {
    return this.dispatch(logLevels.info, message, ...args);
  }
  warn(message: M, ...args: unknown[]) {
    return this.dispatch(logLevels.warn, message, ...args);
  }
  error(message: M, ...args: unknown[]) {
    return this.dispatch(logLevels.error, message, ...args);
  }
}
