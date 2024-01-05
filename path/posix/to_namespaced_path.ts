// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 *
 * @deprecated (will be removed in 0.214.0) Use the path value itself as this
 * is a no-op function.
 */
export function toNamespacedPath(path: string): string {
  // Non-op on posix systems
  return path;
}
