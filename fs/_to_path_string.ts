// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// Copyright the Browserify authors. MIT License.

import { fromFileUrl } from "@std/path/from-file-url";

/**
 * Convert a URL or string to a path.
 *
 * @param pathUrl A URL or string to be converted.
 *
 * @returns The path as a string.
 */
export function toPathString(
  pathUrl: string | URL,
): string {
  return pathUrl instanceof URL ? fromFileUrl(pathUrl) : pathUrl;
}
