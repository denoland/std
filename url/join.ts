// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { join as posixJoin } from "@std/path/posix/join";

/**
 * Joins a base URL or URL string, and a sequence of path segments together,
 * then normalizes the resulting URL.
 *
 * @param url Base URL to be joined with the paths and normalized.
 * @param paths Array of path segments to be joined to the base URL.
 * @returns A complete URL containing the base URL joined with the paths.
 *
 * @example Usage
 *
 * ```ts
 * import { join } from "@std/url/join";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(join("https://deno.land/", "std", "path", "mod.ts").href, "https://deno.land/std/path/mod.ts");
 * assertEquals(join("https://deno.land", "//std", "path/", "/mod.ts").href, "https://deno.land/std/path/mod.ts");
 * ```
 */
export function join(url: string | URL, ...paths: string[]): URL {
  url = new URL(url);
  url.pathname = posixJoin(url.pathname, ...paths);
  return url;
}
