// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * @deprecated (will be removed after 0.181.0) Import from `std/jsonc` instead.
 *
 * {@linkcode parse} function for parsing
 * [JSONC](https://code.visualstudio.com/docs/languages/json#_json-with-comments)
 * (JSON with Comments) strings.
 *
 * This module is browser compatible.
 *
 * @module
 */

export {
  /**
   * @deprecated (will be removed after 0.181.0) Import from `std/jsonc/parse.ts` instead.
   *
   * Valid types as a result of JSON parsing.
   */
  type JSONValue,
  /**
   * @deprecated (will be removed after 0.181.0) Import from `std/jsonc/parse.ts` instead.
   *
   * Converts a JSON with Comments (JSONC) string into an object.
   * If a syntax error is found, throw a SyntaxError.
   *
   * @example
   *
   * ```ts
   * import * as JSONC from "https://deno.land/std@$STD_VERSION/jsonc/mod.ts";
   *
   * console.log(JSONC.parse('{"foo": "bar", } // comment')); //=> { foo: "bar" }
   * console.log(JSONC.parse('{"foo": "bar", } /* comment *\/')); //=> { foo: "bar" }
   * console.log(JSONC.parse('{"foo": "bar" } // comment', {
   *   allowTrailingComma: false,
   * })); //=> { foo: "bar" }
   * ```
   *
   * @param text A valid JSONC string.
   */
  parse,
  /** @deprecated (will be removed after 0.181.0) Import from `std/jsonc/parse.ts` instead. */
  type ParseOptions,
} from "../jsonc/mod.ts";
