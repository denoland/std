import { mapEntries } from "../collections/map_entries.ts";

export type LogLevels = { [level: string]: number };
export type Logger<L extends LogLevels, M, A> = {
  [l in keyof L]: (message: M, additionalData: A) => void;
};
export type LogHandler<L extends LogLevels, M = unknown, A = unknown> = (
  logLevel: keyof L,
  message: M,
  additionalData: A,
) => void;
export type LogDispatcher<L extends LogLevels, M, A> = (
  logLevels: L,
  messageLevel: keyof L,
  thresholdLevel: keyof L,
  message: M,
  additionalData: A,
  handler: LogHandler<L, M, A>,
) => void;

export function buildDefaultLogMessage<L extends LogLevels, M, A>(
  logLevel: keyof L,
  message: M,
  additionalData: A,
) {
  return `[${logLevel}] ${new Date().toLocaleDateString()} ${
    asString(message)
  }${additionalData ? ` ${asString(additionalData)}` : ""}}`;
}

export function asString(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (
    data === null ||
    typeof data === "number" ||
    typeof data === "bigint" ||
    typeof data === "boolean" ||
    typeof data === "undefined" ||
    typeof data === "symbol"
  ) {
    return String(data);
  }

  if (typeof data === "object") {
    return JSON.stringify(data);
  }

  return "undefined";
}

function defaultDispatch<L extends LogLevels, M, A>(
  logLevels: L,
  messageLevel: keyof L,
  thresholdLevel: keyof L,
  message: M,
  additionalData: A,
  handler: LogHandler<L, M, A>,
) {
  if (logLevels[thresholdLevel] > logLevels[messageLevel]) {
    return;
  }

  handler(messageLevel, message, additionalData);
}

export function buildLogger<L extends LogLevels, M, A>(
  logLevels: L,
  thresholdLevel: keyof L,
  handler: LogHandler<L, M, A>,
  dispatcher?: LogDispatcher<L, M, A>,
): Logger<L, M, A> {
  const dispatch = dispatcher ?? defaultDispatch;

  return mapEntries(logLevels, ([level]) => [
    level,
    (message: M, additionalData: A) =>
      dispatch(
        logLevels,
        level,
        thresholdLevel,
        message,
        additionalData,
        handler,
      ),
  ]) as Logger<L, M, A>;
}
