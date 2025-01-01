// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { extname as stableExtname } from "./extname.ts";
import { fromFileUrl } from "./from_file_url.ts";

/**
 * Return the extension of the `path` with leading period.
 *
 * Note: Hashes and query parameters are ignore when constructing a URL.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 *
 * ```ts
 * import { extname } from "@std/path/posix/unstable-extname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(extname("/home/user/Documents/file.ts"), ".ts");
 * assertEquals(extname("/home/user/Documents/"), "");
 * assertEquals(extname("/home/user/Documents/image.png"), ".png");
 * assertEquals(extname(new URL("file:///home/user/Documents/file.ts")), ".ts");
 * assertEquals(extname(new URL("file:///home/user/Documents/file.ts?a=b")), ".ts");
 * assertEquals(extname(new URL("file:///home/user/Documents/file.ts#header")), ".ts");
 * ```
 *
 * @param path The path to get the extension from.
 * @returns The extension (ex. for `file.ts` returns `.ts`).
 */
export function extname(path: string | URL): string {
  if (path instanceof URL) {
    path = fromFileUrl(path);
  }
  return stableExtname(path);
}
