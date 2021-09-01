import {
  buildDefaultLogMessage,
  buildLogger,
  Logger,
  LogHandler,
  LogLevels,
} from "./logger.ts";

function defaultCatcher(err: unknown) {
  console.error(err);
}

export type AsyncLoggerOptions = {
  catcher?: <E = unknown>(err: E) => void;
};
export function buildAsyncLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  handler: (...handlerArgs: Parameters<LogHandler<L, M, A>>) => Promise<void>,
  { catcher = defaultCatcher }: AsyncLoggerOptions = {},
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    async (level, message, additionalData) => {
      try {
        handler(level, message, additionalData);
      } catch (e) {
        catcher(e);
      }
    },
  );
}

export type FileLoggerOptions<L extends LogLevels, M, A> = {
  messageFormatter?: (
    ...handlerArgs: Parameters<LogHandler<L, M, A>>
  ) => string;
  append?: boolean;
};
export function buildFileLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  filename: string,
  {
    messageFormatter = buildDefaultLogMessage,
    append = true,
  }: FileLoggerOptions<L, M, A> = {},
): Logger<L, M, A> {
  return buildAsyncLogger(
    logLevels,
    thresholdLevel,
    async (level, message, additionalData) => {
      const formatter = messageFormatter ?? buildDefaultLogMessage;
      const messageString = formatter(
        level,
        message,
        additionalData,
      );

      return Deno.writeTextFile(filename, `${messageString}\n`, { append });
    },
  );
}

export type ConsoleLoggerOptions<L extends LogLevels, M, A> = {
  messageFormatter?: (
    ...handlerArgs: Parameters<LogHandler<L, M, A>>
  ) => string;
};
export function buildConsoleLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  isErrorLevel: (level: keyof L) => boolean,
  { messageFormatter = buildDefaultLogMessage }: ConsoleLoggerOptions<L, M, A> =
    {},
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    (level, message, additionalData) => {
      const formatter = messageFormatter ?? buildDefaultLogMessage;
      const messageString = formatter(
        level,
        message,
        additionalData,
      );

      if (isErrorLevel(level)) {
        console.error(messageString);
      } else {
        console.log(messageString);
      }
    },
  );
}

export function buildMultiLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  loggers: readonly Logger<L, M, A>[],
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    (level, message, additionalData) =>
      loggers.forEach((it) => it[level](message, additionalData)),
  );
}
