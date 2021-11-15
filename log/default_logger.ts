import {
  buildConsoleLogger,
  buildFileLogger,
  buildMultiLogger,
} from "./builtin_loggers.ts";
import { buildLogger, Logger } from "./logger.ts";

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

const defaultLoggerConsumers: DefaultLogger[] = [];

const defaultLogger = buildMultiLogger(
  defaultLogLevels,
  defaultLoggerConsumers,
);

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
  logger: Logger<DefaultLogLevels, string, unknown>,
) {
  defaultLoggerConsumers.push(logger);
}

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

/**
 * Creates a console logger with the default levels using the given threshold. If you simply want to
 * log to stdout, this is what you want to use.
 */
export function buildDefaultConsoleLogger(
  threshold: keyof DefaultLogLevels,
): DefaultLogger {
  return buildConsoleLogger(
    defaultLogLevels,
    threshold,
    (it) => defaultLogLevels[it] >= defaultLogLevels["warn"],
  );
}

export function buildFrameworkLogger(source: string) {
    return buildLogger<
        DefaultLogLevels,
        string,
        Record<string, unknown>
    >(
        defaultLogLevels,
        null,
        (level, message, additionalData) => defaultLogger[level](
            message,
            {
                ...additionalData,
                source,
            },
        ),
    )
}

