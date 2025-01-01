// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import type { LogRecord } from "./logger.ts";

/**
 * JSON log formatter.
 *
 * @example Usage
 * ```ts
 * import { LogRecord } from "@std/log/logger";
 * import { jsonFormatter } from "@std/log/formatters";
 * import { LogLevels } from "@std/log/levels";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const record = new LogRecord({
 *   msg: "Hello, world!",
 *   args: ["foo", "bar"],
 *   level: LogLevels.INFO,
 *   loggerName: "example",
 * });
 * const formatted = jsonFormatter(record);
 *
 * assertEquals(
 *   formatted,
 *   `{"level":"INFO","datetime":${record.datetime.getTime()},"message":"Hello, world!","args":["foo","bar"]}`,
 * );
 * ```
 *
 * @param logRecord Log record to format.
 * @returns JSON string representation of the log record.
 */
export function jsonFormatter(logRecord: LogRecord): string {
  return JSON.stringify({
    level: logRecord.levelName,
    datetime: logRecord.datetime.getTime(),
    message: logRecord.msg,
    args: flattenArgs(logRecord.args),
  });
}

function flattenArgs(args: unknown[]): unknown {
  if (args.length === 1) {
    return args[0];
  } else if (args.length > 1) {
    return args;
  }
}

/** Formatters for log records. */
export const formatters = { jsonFormatter } as const;
