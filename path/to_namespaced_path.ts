// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { checkWindows } from "./_os.ts";
import {
  posixToNamespacedPath,
  windowsToNamespacedPath,
} from "./_to_namespaced_path.ts";
import type { PathOptions } from "./_interface.ts";

/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */
export function toNamespacedPath(path: string, options?: PathOptions): string {
  return checkWindows(options?.os)
    ? windowsToNamespacedPath(path)
    : posixToNamespacedPath(path);
}
