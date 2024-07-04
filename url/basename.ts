// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { basename as posixBasename } from "@std/path/posix/basename";
import { strip } from "./_strip.ts";

/**
 * Returns the base name of a URL or URL string, optionally removing a suffix.
 *
 * Trailing `/`s are ignored. If no path is present, the host name is returned.
 * If a suffix is provided, it will be removed from the base name. URL queries
 * and hashes are ignored.
 *
 * @param url The URL from which to extract the base name.
 * @param suffix An optional suffix to remove from the base name.
 * @returns The base name of the URL.
 *
 * @example Basic usage
 * ```ts
 * import { basename } from "@std/url/basename";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(basename("https://deno.land/std/assert/mod.ts"), "mod.ts");
 * assertEquals(basename(new URL("https://deno.land/std/assert/mod.ts")), "mod.ts");
 * assertEquals(basename("https://deno.land/std/assert/mod.ts?a=b"), "mod.ts");
 * assertEquals(basename("https://deno.land/std/assert/mod.ts#header"), "mod.ts");
 * assertEquals(basename("https://deno.land/"), "deno.land");
 * ```
 *
 * @example Removing a suffix
 *
 * Defining a suffix will remove it from the base name.
 *
 * ```ts
 * import { basename } from "@std/url/basename";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(basename("https://deno.land/std/assert/mod.ts", ".ts"), "mod");
 * assertEquals(basename(new URL("https://deno.land/std/assert/mod.ts"), ".ts"), "mod");
 * assertEquals(basename("https://deno.land/std/assert/mod.ts?a=b", ".ts"), "mod");
 * assertEquals(basename("https://deno.land/std/assert/mod.ts#header", ".ts"), "mod");
 * ```
 */
export function basename(url: string | URL, suffix?: string): string {
  url = new URL(url);
  strip(url);
  return posixBasename(url.href, suffix);
}
