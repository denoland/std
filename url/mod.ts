// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Utilities for working with
 * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/URL | URL}s.
 *
 * ```ts
 * import { basename, join, normalize } from "@std/url";
 * import { assertEquals } from "@std/assert";
 *
 * const url = new URL("https:///deno.land///std//assert//.//mod.ts");
 * const normalizedUrl = normalize(url);
 *
 * assertEquals(normalizedUrl.href, "https://deno.land/std/assert/mod.ts");
 * assertEquals(basename(normalizedUrl), "mod.ts");
 *
 * const joinedUrl = join(normalizedUrl, "..", "..", "async", "retry.ts");
 *
 * assertEquals(joinedUrl.href, "https://deno.land/std/async/retry.ts");
 * ```
 *
 * @deprecated Use functions from
 * {@linkcode https://jsr.io/@std/path/doc/posix/~ | @std/path/posix}
 * instead (examples included). `@std/url` will be removed in the future.
 *
 * @module
 */

export * from "./basename.ts";
export * from "./dirname.ts";
export * from "./extname.ts";
export * from "./join.ts";
export * from "./normalize.ts";
