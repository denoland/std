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

export type AsyncLoggerOptions = Readonly<{
  catcher?: <E = unknown>(err: E) => void;
}>;

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

export type FileLoggerOptions<L extends LogLevels, M, A> = Readonly<{
  messageFormatter?: (
    ...handlerArgs: Parameters<LogHandler<L, M, A>>
  ) => string;
  append?: boolean;
}>;
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

/** Options for `buildConsoleLogger` */
export type ConsoleLoggerOptions<L extends LogLevels, M, A> = Readonly<{
  messageFormatter?: (
    ...handlerArgs: Parameters<LogHandler<L, M, A>>
  ) => string;
}>;

/**
 * Creates a custom console logger that logs to stdout and stderr
*
* @param logLevels Log levels to be offered
* @param thresholdLevel Threshold level messages need to match or surpass to be logged
* @param isErrorLevel Predicate to decide whether messages of a given log level should be logged to stderr or stdout
 */
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

export type MultiLoggerOptions<L extends LogLevels> = Readonly<{
  thresholdLevel?: keyof L | null;
}>;

/**
 * Creates a custom multi logger that passes messages to all given loggers. Defaults to no threshold
 * (and thus no filter), but a threshold can optionally be passed.
 */
export function buildMultiLogger<L extends LogLevels, M, A>(
  logLevels: L,
  loggers: readonly Logger<L, M, A>[],
  { thresholdLevel = null }: MultiLoggerOptions<L> = {},
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    (level, message, additionalData) =>
      loggers.forEach((it) => it[level](message, additionalData)),
  );
}
