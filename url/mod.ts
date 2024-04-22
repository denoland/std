// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for working with
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/URL | URL}s.
 *
 * This module is browser compatible.
 *
 * ## Get basename
 *
 * {@linkcode basename} returns the base name of a URL or URL string, optionally
 * removing a suffix.
 *
 * ```ts
 * import { basename } from "https://deno.land/std@$STD_VERSION/url/basename.ts";
 *
 * basename("https://deno.land/std/assert/mod.ts"); // "mod.ts"
 *
 * basename(new URL("https://deno.land/std/assert/mod.ts")); // "mod.ts"
 *
 * basename("https://deno.land/std/assert/mod.ts?a=b"); // "mod.ts"
 *
 * basename("https://deno.land/std/assert/mod.ts#header"); // "mod.ts"
 *
 * basename("https://deno.land/"); // "deno.land"
 * ```
 *
 * ## Get directory path
 *
 * {@linkcode dirname} returns the directory path of a URL or URL string.
 *
 * ```ts
 * import { dirname } from "https://deno.land/std@$STD_VERSION/url/dirname.ts";
 *
 * dirname("https://deno.land/std/path/mod.ts?a=b").href; // "https://deno.land/std/path"
 *
 * dirname("https://deno.land/").href; // "https://deno.land"
 * ```
 *
 * ## Get file extension
 *
 * {@linkcode extname} returns the file extension of a given URL or string with
 * leading period.
 *
 * ```ts
 * import { extname } from "https://deno.land/std@$STD_VERSION/url/extname.ts";
 *
 * extname("https://deno.land/std/path/mod.ts"); // ".ts"
 *
 * extname("https://deno.land/std/path/mod"); // ""
 *
 * extname("https://deno.land/std/path/mod.ts?a=b"); // ".ts"
 *
 * extname("https://deno.land/"); // ""
 * ```
 *
 * ## Join URL paths
 *
 * {@linkcode join} joins a base URL or URL string, and a sequence of path
 * segments together, then normalizes the resulting URL.
 *
 * ```ts
 * import { join } from "https://deno.land/std@$STD_VERSION/url/join.ts";
 *
 * join("https://deno.land/", "std", "path", "mod.ts").href;
 * // "https://deno.land/std/path/mod.ts"
 *
 * join("https://deno.land", "//std", "path/", "/mod.ts").href;
 * // "https://deno.land/path/mod.ts"
 * ```
 *
 * ## Normalize URL
 *
 * {@linkcode normalize} normalizes the URL or URL string, resolving `..` and
 * `.` segments. Multiple sequential `/`s are resolved into a single `/`.
 *
 * ```ts
 * import { normalize } from "https://deno.land/std@$STD_VERSION/url/normalize.ts";
 *
 * normalize("https:///deno.land///std//assert//.//mod.ts").href;
 * // "https://deno.land/std/path/mod.ts"
 *
 * normalize("https://deno.land/std/assert/../async/retry.ts").href;
 * // "https://deno.land/std/async/retry.ts"
 * ```
 *
 * @module
 */

export * from "./basename.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./join.ts";
export * from "./normalize.ts";
