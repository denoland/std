// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { isWindows } from "./_os.ts";
import {
  posixToNamespacedPath,
  windowsToNamespacedPath,
} from "./_to_namespaced_path.ts";

/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */
export function toNamespacedPath(path: string): string {
  return isWindows
    ? windowsToNamespacedPath(path)
    : posixToNamespacedPath(path);
}
