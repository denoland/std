import {
  buildDefaultLogMessage,
  buildLogger,
  Logger,
  LogLevels,
} from "./logger.ts";

export function buildFileLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  filename: string,
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    (level, message, additionalData) => {
      const messageString = buildDefaultLogMessage(
        level,
        message,
        additionalData,
      );

      Deno.writeTextFileSync(filename, messageString, { append: true });
    },
  );
}

export function buildConsoleLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  isErrorLevel: (level: keyof L) => boolean,
): Logger<L, M, A> {
  return buildLogger(
    logLevels,
    thresholdLevel,
    (level, message, additionalData) => {
      const messageString = buildDefaultLogMessage(
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
