// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { dirname as posixDirname } from "@std/path/posix/dirname";
import { strip } from "./_strip.ts";

/**
 * Returns the directory path of a URL or URL string.
 *
 * The directory path is the portion of a URL up to but excluding the final path
 * segment.
 *
 * The final path segment, along with any query or hash values are
 * removed. If there is no path segment then the URL origin is returned.
 *
 * @param url URL to extract the directory from.
 * @returns The directory path of the URL.
 *
 * @example Basic usage
 * ```ts
 * import { dirname } from "@std/url/dirname";
 *
 * dirname("https://deno.land/std/path/mod.ts?a=b").href; // "https://deno.land/std/path"
 *
 * dirname("https://deno.land/").href; // "https://deno.land"
 * ```
 */

export function dirname(url: string | URL): URL {
  url = new URL(url);
  strip(url);
  url.pathname = posixDirname(url.pathname);
  return url;
}
