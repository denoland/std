// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Use this to retrieve the numeric log level by it's associated name.
 * Defaults to INFO.
 */
export const LogLevels = {
  NOTSET: 0,
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
  CRITICAL: 50,
  /* @deprecated (will be removed after 0.211.0) Use {@linkcode getLevelName} instead */
  0: "NOTSET",
  /* @deprecated (will be removed after 0.211.0) Use {@linkcode getLevelName} instead */
  10: "DEBUG",
  /* @deprecated (will be removed after 0.211.0) Use {@linkcode getLevelName} instead */
  20: "INFO",
  /* @deprecated (will be removed after 0.211.0) Use {@linkcode getLevelName} instead */
  30: "WARNING",
  /* @deprecated (will be removed after 0.211.0) Use {@linkcode getLevelName} instead */
  40: "ERROR",
  /* @deprecated (will be removed after 0.211.0) Use {@linkcode getLevelName} instead */
  50: "CRITICAL",
} as const;

/** Union of valid log levels */
export type LogLevel = typeof LogLevels[LevelName];

/** Union of valid log level names */
export type LevelName = Exclude<keyof typeof LogLevels, number>;

/** Permitted log level names */
export const LogLevelNames: LevelName[] = Object.keys(LogLevels).filter((key) =>
  isNaN(Number(key))
) as LevelName[];

const byLevel: Record<LogLevel, LevelName> = {
  [LogLevels.NOTSET]: "NOTSET",
  [LogLevels.DEBUG]: "DEBUG",
  [LogLevels.INFO]: "INFO",
  [LogLevels.WARNING]: "WARNING",
  [LogLevels.ERROR]: "ERROR",
  [LogLevels.CRITICAL]: "CRITICAL",
};

/**
 * Returns the numeric log level associated with the passed,
 * stringy log level name.
 *
 * @returns - Deprecated (will return {@linkcode LogLevel} after 0.211.0)
 */
export function getLevelByName(name: LevelName): number {
  const level = LogLevels[name];
  if (level !== undefined) {
    return level;
  }
  throw new Error(`no log level found for name: ${name}`);
}

/**
 * Returns the stringy log level name provided the numeric log level
 *
 * @param level - Deprecated (will accept {@linkcode LogLevel} after 0.211.0)
 */
export function getLevelName(level: number): LevelName {
  const levelName = byLevel[level as LogLevel];
  if (levelName) {
    return levelName;
  }
  throw new Error(`no level name found for level: ${level}`);
}
