// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { normalize as posixNormalize } from "@std/path/posix/normalize";

/**
 * Normalizes the URL or URL string, resolving `..` and `.` segments. Multiple
 * sequential `/`s are resolved into a single `/`.
 *
 * @param url URL to be normalized.
 * @returns Normalized URL.
 *
 * @example Usage
 *
 * ```ts
 * import { normalize } from "@std/url/normalize";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(normalize("https:///deno.land///std//assert//.//mod.ts").href, "https://deno.land/std/assert/mod.ts");
 * assertEquals(normalize("https://deno.land/std/assert/../async/retry.ts").href, "https://deno.land/std/async/retry.ts");
 * ```
 */
export function normalize(url: string | URL): URL {
  url = new URL(url);
  url.pathname = posixNormalize(url.pathname);
  return url;
}
