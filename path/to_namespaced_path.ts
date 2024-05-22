// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import { toNamespacedPath as posixToNamespacedPath } from "./posix/to_namespaced_path.ts";
import { toNamespacedPath as windowsToNamespacedPath } from "./windows/to_namespaced_path.ts";

/**
 * Resolves path to a namespace path.  This is a no-op on
 * non-windows systems.
 * 
 * @param path to resolve to namespace
 * @returns resolved namespace path
 * 
 * 
 * @example Usage
 * ```ts
 * import { toNamespacedPath } from "@std/path/to-namespaced-path";
 * 
 * toNamespacedPath("C:\\foo\\bar"); // " \\?\C:\\foo\\bar"
 * ```
 */
export function toNamespacedPath(path: string): string {
  return isWindows
    ? windowsToNamespacedPath(path)
    : posixToNamespacedPath(path);
}
