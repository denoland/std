// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { GlobOptions } from "./_common/glob_to_reg_exp.ts";
import { isWindows } from "./_os.ts";
import { normalizeGlob as posixNormalizeGlob } from "./posix/normalize_glob.ts";
import {
  normalizeGlob as windowsNormalizeGlob,
} from "./windows/normalize_glob.ts";

export type { GlobOptions };

/**
 * Normalizes a glob string.
 *
 * Behaves like normalize(), but doesn't collapse "**\/.." when `globstar` is true.
 *
 * @param glob - glob string to normalize
 * @param options - glob options
 * @returns normalized glob string
 *
 * @example Usage
 * ```ts
 * import { normalizeGlob } from "https://deno.land/std/path/mod.ts";
 *
 * normalizeGlob("foo/bar/../baz"); // "foo/baz"
 * normalizeGlob("foo/**\/../bar/../baz", { globstar: true }); // "foo/**\/../baz"
 * ```
 */
export function normalizeGlob(
  glob: string,
  options: GlobOptions = {},
): string {
  return isWindows
    ? windowsNormalizeGlob(glob, options)
    : posixNormalizeGlob(glob, options);
}
