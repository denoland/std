import {
  buildConsoleLogger,
  buildFileLogger,
  buildMultiLogger,
} from "./builtin_loggers.ts";
import { buildLogger, Logger } from "./logging.ts";

/** Default log levels used for the default logger */
export const defaultLogLevels = {
  trace: 1,
  debug: 2,
  info: 3,
  warn: 4,
  error: 5,
};

/** Default log levels type used for the default logger */
export type DefaultLogLevels = typeof defaultLogLevels;

type DefaultLogger = Logger<
  DefaultLogLevels,
  string,
  { source?: string } & Record<string, unknown>
>;

/**
 * Registers a logger following the default logger types to get passed messages sent to the default logger (`log`).
 *
 * Example:
 *
 * ```typescript
 * import { log, addDefaultLogger, buildDefaultConsoleLogger } from "https://deno.land/std/@STD_VERSION/log/mod.ts"
 *
 * addDefaultLogger(
 *   buildDefaultConsoleLogger("info")
 * )
 *
 * log.warn("Foo") // Will print "foo" through the registered logger above
 * ```
 */
export function addDefaultLogger(
  logger: DefaultLogger,
) {
  defaultLoggerConsumers.push(logger);
}

/**
 * Creates a file logger with the default log levels using the given threshold.
 */
export function buildDefaultFileLogger(
  threshold: keyof DefaultLogLevels,
  filename: string,
): DefaultLogger {
  return buildFileLogger(
    defaultLogLevels,
    threshold,
    filename,
  );
}

type DefaultConsoleLogger = DefaultLogger & { marker: symbol };
const defaultConsoleLoggerMarker = Symbol("Default Console Logger");
/**
 * Creates a console logger with the default levels using the given threshold. If you simply want to
 * log to stdout, this is what you want to use.
 */
export function buildDefaultConsoleLogger(
  threshold: keyof DefaultLogLevels,
): DefaultConsoleLogger {
  return {
    ...buildConsoleLogger(
      defaultLogLevels,
      threshold,
      (it) => defaultLogLevels[it] >= defaultLogLevels["warn"],
    ),
    marker: defaultConsoleLoggerMarker,
  };
}

export function buildFrameworkLogger(source: string) {
  return buildLogger<
    DefaultLogLevels,
    string,
    Record<string, unknown>
  >(
    defaultLogLevels,
    null,
    (level, message, additionalData) =>
      defaultLogger[level](
        message,
        {
          ...additionalData,
          source,
        },
      ),
  );
}

const defaultLoggerConsumers: (DefaultLogger | DefaultConsoleLogger)[] = [
  buildDefaultConsoleLogger("info"),
];

export function disableDefaultConsoleLogger() {
  const index = defaultLoggerConsumers.findIndex((it) =>
    (it as DefaultConsoleLogger).marker === defaultConsoleLoggerMarker
  );

  if (index === -1) {
    throw new Error(
      "Tried disabling the default console logger, but it has already been disabled",
    );
  }

  defaultLoggerConsumers.splice(index, 1);
}

export function setDefaultConsoleLoggerThreshold(
  threshold: keyof DefaultLogLevels,
) {
  disableDefaultConsoleLogger();
  addDefaultLogger(
    buildDefaultConsoleLogger(threshold),
  );
}

const defaultLogger = buildMultiLogger(
  defaultLogLevels,
  defaultLoggerConsumers,
);

/**
 * The default logger. Does nothing by default, as it is ane empty multi logger - use `addDefaultLogger` to add loggers to handle it's meessages.
 *
 * If you are writing an application, consider using this if you want to use th default log levels.
 *
 * If you are a framework and want to log for your consumers, use this to allow them to handle your messages in a standardized way.
 *
 * Example:
 *
 * ```typescript
 * import { log } from "https://deno.land/std/@STD_VERSION/log/mod.ts"
 *
 * log.info('Some messge')
 * log.debug('A debug message')
 * log.warn('Warning')
 * ```
 */
export const log = defaultLogger;
