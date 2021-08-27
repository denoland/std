import {
  buildDefaultLogMessage,
  buildLogger,
  Logger,
  LogLevels,
} from "./logger.ts";

function defaultCatcher(err: unknown) {
  console.error(err);
}

export function buildAsyncLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  handler: (level: keyof L, message: M, additionalData: A) => Promise<void>,
  catcher: (err: unknown) => void = defaultCatcher,
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    async (level, message, additionalData) => {
      try {
          handler(level, message, additionalData);
      } catch (e) {
        catcher(e)
      }
    },
  );
}

export function buildFileLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  filename: string,
  messageFormatter?: (level: keyof L, message: M, additionalData: A) => string,
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

      return Deno.writeTextFile(filename, messageString, { append: true });
    },
  );
}

export function buildConsoleLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  isErrorLevel: (level: keyof L) => boolean,
  messageFormatter?: (level: keyof L, message: M, additionalData: A) => string,
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
