import { buildMultiLogger } from "./builtin_loggers.ts";
import { Logger } from "./logger.ts";

/** Default log levels used for the default logger */
export const defaultLogLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

/** Default log levels type used for the default logger */
export type DefaultLogLevels = typeof defaultLogLevels;

const defaultLoggerConsumers: Logger<DefaultLogLevels, string, unknown>[] = [];

const defaultLogger = buildMultiLogger<
  DefaultLogLevels,
  string,
  unknown
>(
  defaultLogLevels,
  defaultLoggerConsumers,
);

/**
 * Registers a logger following the default logger types to get passed messages sent to the deefault logger (`log`).
 *
 * Example:
 *
 * ```typescript
 * import { log, addDefaultLogger, defaultConsoleLogger } from "https://deno.land/std/@STD_VERSION/log/mod.ts"
 *
 * addDefaultLogger(defaultConsoleLogger)
 *
 * log.info("Foo") // Will print "foo" through the registered logger above
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
 * If you are a library and want to log for your consumers, use this to allow them to handle your messages in a standardized way.
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
