// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

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

export type DefaultLogger = Logger<
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
 * import { log, addDefaultLogger, buildDefaultConsoleLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts"
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

const sourceThresholds: {
  default: keyof DefaultLogLevels | false;
  sources: Partial<ThirdPartyThresholds>;
} = {
  default: "warn",
  sources: {},
};

export type ThirdPartyThresholds = {
  [source: string]: keyof DefaultLogLevels | false;
};

/**
 * Sets the thresholds for log messages from third parties, with property
 * names being source identifier (which you will see prefixed in all their log messages)
 * with values being the respective log level threshold.
 *
 * Pass a threshold value of `false` to disable messages for a particular source.
 *
 * Example:
 *
 * ```ts
 * import { setThirdPartyThresholds } from "https://deno.land/std@$STD_VERION/log/mod.ts"
 *
 * setThirdPartyThresholds({
 *   "awesome-lib": "info",
 *   "super-framework": "trace",
 *   "annoying-module": false,
 * })
 * ```
 */
export function setThirdPartyThresholds(thresholds: ThirdPartyThresholds) {
  sourceThresholds.sources = {
    ...sourceThresholds.sources,
    ...thresholds,
  };
}

/**
 * Sets the threshold for log messages from third party modules, which starts
 * out as `"warn"`.
 *
 * Pass `false` to disable third party logging from source you have not explicitly
 * configured otherwise.
 *
 * Example:
 *
 * ```ts
 * import { setThirdPartyDefaultThreshold } from "https://deno.land/std@$STD_VERION/log/mod.ts"
 *
 * setThirdPartyDefaultThreshold("info")
 * ```
 */
export function setThirdPartyDefaultThreshold(
  threshold: keyof DefaultLogLevels | false,
) {
  sourceThresholds.default = threshold;
}

/**
 * Creates a logger for an external module. Use this to log if you are writing a library.
 * The given source identifier will appear as a prefix on every log message and can be
 * used by users to configure logging filters for your module.
 */
export function buildThirdPartyLogger(source: string) {
  return buildLogger<
    DefaultLogLevels,
    string,
    Record<string, unknown>
  >(
    defaultLogLevels,
    null,
    (level, message, additionalData) =>
      defaultLogger[level](
        `[${source}]\t${message}`,
        additionalData,
      ),
    (levels, _, handler, level, ...rest) => {
      const messageLevel = levels[level];
      const sourceThreshold = sourceThresholds.sources[source] ??
        sourceThresholds.default;

      if (sourceThreshold === false) {
        return;
      }

      if (messageLevel >= levels[sourceThreshold]) {
        handler(level, ...rest);
      }
    },
  );
}

const defaultLoggerConsumers: (DefaultLogger | DefaultConsoleLogger)[] = [
  buildDefaultConsoleLogger("info"),
];

/** Stops the default logger from logging to the console */
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

/**
 * Sets the threshold for messages the default logger will log
 * to the console. Starts out as "info"
 */
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
 * import { log } from "https://deno.land/std@$STD_VERION/log/mod.ts"
 *
 * log.info('Some messge')
 * log.debug('A debug message')
 * log.warn('Warning')
 * ```
 */
export const log = defaultLogger;
