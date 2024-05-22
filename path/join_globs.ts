// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { GlobOptions } from "./_common/glob_to_reg_exp.ts";
import { isWindows } from "./_os.ts";
import { joinGlobs as posixJoinGlobs } from "./posix/join_globs.ts";
import { joinGlobs as windowsJoinGlobs } from "./windows/join_globs.ts";

export type { GlobOptions };

/**
 * Joins a sequence of `globs`, then normalizes the resulting glob.
 *
 * Behaves like join(), but doesn't collapse "**\/.." when `globstar` is true.
 *
 * @param globs - globs to be joined and normalized
 * @param options - glob options
 * @returns joined and normalized glob string
 *
 * @example Usage
 * ```ts
 * import { joinGlobs } from "@std/path/join-globs";
 *
 * joinGlobs(["foo", "bar", "..", "baz"]); // "foo/baz"
 * joinGlobs(["foo", "**\/..", "bar", "..", "baz"], { globstar: true }); // "foo/**\/../baz"
 * ```
 */
export function joinGlobs(
  globs: string[],
  options: GlobOptions = {},
): string {
  return isWindows
    ? windowsJoinGlobs(globs, options)
    : posixJoinGlobs(globs, options);
}
