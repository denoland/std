// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Provides tools for working with JSONC (JSON with comments). Currently, this
 * module only provides a means of parsing JSONC. JSONC serialization is not
 * yet supported.
 *
 * This module is browser compatible.
 *
 * @example
 * ```ts Parsing JSONC
 * import { parse } from "@std/jsonc";
 *
 * parse('{"foo": "bar", } // comment'); // { foo: "bar" }
 * parse('{"foo": "bar", } /* comment *\/'); // { foo: "bar" }
 * parse('{"foo": "bar" } // comment', {
 *   allowTrailingComma: false,
 * }); // { foo: "bar" }
 * ```
 *
 * @module
 */
export * from "./parse.ts";
