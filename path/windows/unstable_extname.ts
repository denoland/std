// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { extname as stableExtname } from "./extname.ts";
import { fromFileUrl } from "./from_file_url.ts";

/**
 * Return the extension of the `path` with leading period.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { extname } from "@std/path/windows/unstable-extname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(extname("file.ts"), ".ts");
 * assertEquals(extname(new URL("file:///C:/foo/bar/baz.ext")), ".ext");
 * ```
 *
 * @param path The path to get the extension from.
 * @returns The extension of the `path`.
 */
export function extname(path: string | URL): string {
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  return stableExtname(path);
}
