import { buildConsoleLogger } from "./builtin_loggers.ts"

export const defaultLogLevels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

const defaultLogger = buildConsoleLogger(
    defaultLogLevels,
    "info",
    level => defaultLogLevels.error >= defaultLogLevels[level],
)

export const log = defaultLogger

