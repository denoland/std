// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { normalize } from "./normalize.ts";

/**
 * Join all given a sequence of a `URL` and `paths`, then normalizes the resulting URL.
 *
 * @example
 * ```ts
 * import { join } from "https://deno.land/std@$STD_VERSION/url/join";
 *
 * console.log(join("https://deno.land/", "std", "path", "mod.ts").href);
 * // Outputs: "https://deno.land/std/path/mod.ts"
 *
 * console.log(join("https://deno.land", "//std", "path/", "/mod.ts").href);
 * // Outputs: "https://deno.land/path/mod.ts"
 * ```
 *
 * @param url the base URL to be joined with the paths and normalized
 * @param paths array of path segments to be joined to the base URL
 * @returns a complete URL string containing the base URL joined with the paths
 */
export function join(url: string | URL, ...paths: string[]): URL {
  return normalize(url.toString() + "/" + paths.join("/"));
}
