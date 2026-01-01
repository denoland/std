// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions for HTML tasks such as escaping or unescaping HTML entities.
 *
 * ```ts
 * import { unescape } from "@std/html/entities";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(unescape("&lt;&gt;&#39;&amp;AA"), "<>'&AA");
 * assertEquals(unescape("&thorn;&eth;"), "&thorn;&eth;");
 * ```
 *
 * @module
 */

export * from "./entities.ts";
