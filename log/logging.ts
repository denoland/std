import { mapEntries } from "../collections/map_entries.ts";

/**
 * Type to define log levels as a constant record of strings representing the level name and numbers representing their order.
 *
 * Example:
 *
 * ```typescript
 * const myLogLevels: LogLevels = {
 *   irrelevant: 1,
 *   normal: 2,
 *   important: 3,
 * };
 * ```
 */
export type LogLevels = { [level: string]: number };

/**
 * A logger that accepts messages of type M with optional additionalData of type A. Offers log levels
 * defined by L in a `console` like API.
 */
export type Logger<L extends LogLevels, M, A> = {
  [l in keyof L]: (message: M, additionalData?: A) => void;
};

/**
 * Callback to handle logging incoming messages. Will be called by a dispatcher.
 */
export type LogHandler<L extends LogLevels, M = unknown, A = unknown> = (
  logLevel: keyof L,
  message: M,
  additionalData?: A,
) => void;

/**
 * Callback to decide if and how to pass incoming meessages on to the actual handler
 */
export type LogDispatcher<L extends LogLevels, M, A> = (
  logLevels: L,
  thresholdLevel: keyof L | null,
  handler: LogHandler<L, M, A>,
  ...handlerArgs: Parameters<typeof handler>
) => void;

/**
 * Default log message builder useed by all builtin loggers. Converts message
 * and addition data to strings using `toLoggableString` and prefixes them with
 * log level and timestamp.
 */
export function buildDefaultLogMessage<L extends LogLevels, M, A>(
  ...[logLevel, message, additionalData]: Parameters<LogHandler<L, M, A>>
) {
  return `[${logLevel}]\t[${new Date().toLocaleString()}]\t${
    toLoggableString(message)
  }${additionalData ? ` ${toLoggableString(additionalData)}` : ""}`;
}

/**
 * Default string converter for arbitrary data to be logged
 */
export function toLoggableString(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    return JSON.stringify(data);
  }

  return String(data);
}

/**
 * Default dispatcher for all loggers. Filters out all messages that are below the threshold.
 */
export function defaultDispatch<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L | null,
  handler: LogHandler<L, M, A>,
  ...handlerArgs: Parameters<typeof handler>
) {
  const [messageLevel] = handlerArgs;

  if (
    thresholdLevel !== null &&
    logLevels[thresholdLevel] > logLevels[messageLevel]
  ) {
    return;
  }

  handler(...handlerArgs);
}
/**
 * Builds a custom logger for the given log levels with the given threshold level.
 *
 * Example:
 *
 * ```typescript
 * import { buildLogger } from "https://deno.land/std@$STD_VERSION/log/mod.ts";
 * import { assertEquals } from "https://deno.land/std@$STD_VERSION/testing/asserts.ts";
 *
 * const myLogLevels = {
 *   irrelevant: 1,
 *   normal: 2,
 *   important: 3,
 * };
 *
 * const messageStash: string[] = [];
 *
 * export const logger = buildLogger(
 *   myLogLevels,
 *   "normal",
 *   (level, message: string) => {
 *     messageStash.push(`${level} ${message}`);
 *   },
 * );
 *
 * logger.irrelevant("It is 23 degrees and slightly cloudy");
 * logger.normal("Someone has visited the website");
 * logger.important("User database has been exported");
 *
 * assertEquals(
 *   messageStash,
 *   ["Someone has visited the website", "User database has been exported"],
 * );
 * ```
 *
 * @param logLevels Log levels available to choose from for sending a message
 * through this logger
 * @param thresholdLevel Threshold level for messages. If
 * the defaultDispatcher is used, it will filter out all messages below the
 * threshold
 * @param handler Callback to handle the messages that have been
 * dispatched. This should contain your actual logging logic (e.g. `console.log`)
 * @param dispatcher Optional callback which gets passed all message data, the
 * threshold and the actual handler to decide if or how to call the handler.
 * Defaults to the default dispatcher, which will call the handler for
 * all messages equal or above the threshold.
 */
export function buildLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L | null,
  handler: LogHandler<L, M, A>,
  dispatcher?: LogDispatcher<L, M, A>,
): Logger<L, M, A> {
  const dispatch = dispatcher ?? defaultDispatch;

  return mapEntries(logLevels, ([level]) => [
    level,
    (message: M, additionalData?: A) =>
      dispatch(
        logLevels,
        thresholdLevel,
        handler,
        level,
        message,
        additionalData,
      ),
  ]) as Logger<L, M, A>;
}
