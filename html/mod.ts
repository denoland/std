// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Functions for HTML tasks such as escaping or unescaping HTML entities.
 *
 * ```ts
 * import { escape } from "@std/html/entities";
 *
 * escape("<>'&AA"); // "&lt;&gt;&#39;&amp;AA"
 *
 * // Characters that don't need to be escaped will be left alone,
 * // even if named HTML entities exist for them.
 * escape("þð"); // "þð"
 * ```
 *
 * @module
 */

export * from "./entities.ts";
