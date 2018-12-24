export const LogLevel = {
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
  CRITICAL: 50
};

const byName = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARNING: LogLevel.WARNING,
  ERROR: LogLevel.ERROR,
  CRITICAL: LogLevel.CRITICAL
};

const byLevel = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARNING]: "WARNING",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.CRITICAL]: "CRITICAL"
};

export function getLevelByName(name: string): number {
  return byName[name];
}

export function getNameByLevel(level: number): string {
  return byLevel[level];
}
