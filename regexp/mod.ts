// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Functions for tasks related to
 * {@link https://en.wikipedia.org/wiki/Regular_expression | regular expression} (regexp),
 * such as escaping text for interpolation into a regexp.
 *
 * @module
 *
 * @example
 * ```ts
 * import { escape } from "@std/regexp";
 * import { assertEquals, assertMatch, assertNotMatch } from "@std/assert";
 *
 * const re = new RegExp(`^${escape(".")}$`, "u");
 *
 * assertEquals("^\\.$", re.source);
 * assertMatch(".", re);
 * assertNotMatch("a", re);
 * ```
 */

export * from "./escape.ts";
