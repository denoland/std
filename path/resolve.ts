// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { resolve as posixResolve } from "./posix/resolve.ts";
import { resolve as windowsResolve } from "./windows/resolve.ts";

/**
 * Resolves path segments into a path.
 *
 * @param pathSegments Path segments to process to path.
 *
 * @returns The resolved path.
 *
 * @example Usage
 * ```ts
 * import { resolve } from "@std/path/resolve";
 *
 * // posix
 * resolve("/foo", "bar", "baz"); // "/foo/bar/baz"
 * resolve("/foo", "/bar", "baz"); // "/bar/baz"
 *
 * // win32
 * resolve("C:\\foo", "bar", "baz"); // "C:\\foo\\bar\\baz"
 * resolve("C:\\foo", "C:\\bar", "baz"); // "C:\\bar\\baz"
 * ```
 */
export function resolve(...pathSegments: string[]): string {
  return isWindows
    ? windowsResolve(...pathSegments)
    : posixResolve(...pathSegments);
}
