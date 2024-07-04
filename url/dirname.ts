// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { dirname as posixDirname } from "@std/path/posix/dirname";
import { strip } from "./_strip.ts";

/**
 * Returns the directory path URL of a URL or URL string.
 *
 * The directory path is the portion of a URL up to but excluding the final path
 * segment. URL queries and hashes are ignored.
 *
 * @param url URL to extract the directory from.
 * @returns The directory path URL of the URL.
 *
 * @example Usage
 * ```ts
 * import { dirname } from "@std/url/dirname";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(dirname("https://deno.land/std/path/mod.ts"), new URL("https://deno.land/std/path"));
 * assertEquals(dirname(new URL("https://deno.land/std/path/mod.ts")), new URL("https://deno.land/std/path"));
 * ```
 */

export function dirname(url: string | URL): URL {
  url = new URL(url);
  strip(url);
  url.pathname = posixDirname(url.pathname);
  return url;
}
