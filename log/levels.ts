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
} as const;

/** Union of valid log levels */
export type LogLevel = typeof LogLevels[LevelName];

/** Union of valid log level names */
export type LevelName = keyof typeof LogLevels;

/** Permitted log level names */
export const LogLevelNames = Object.keys(LogLevels) as LevelName[];

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
 */
export function getLevelByName(name: LevelName): LogLevel {
  const level = LogLevels[name];
  if (level !== undefined) {
    return level;
  }
  throw new Error(`no log level found for "${name}"`);
}

/** Returns the stringy log level name provided the numeric log level */
export function getLevelName(level: LogLevel): LevelName {
  const levelName = byLevel[level];
  if (levelName) {
    return levelName;
  }
  throw new Error(`no level name found for level: ${level}`);
}
