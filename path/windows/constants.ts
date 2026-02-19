// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * The character used to separate entries in the PATH environment variable.
 */
export const DELIMITER = ";" as const;
/**
 * The character used to separate components of a file path.
 */
export const SEPARATOR = "\\" as const;
/**
 * A regular expression that matches one or more path separators.
 */
// deno-lint-ignore deno-style-guide/naming-convention
export const SEPARATOR_PATTERN = /[\\/]+/;
