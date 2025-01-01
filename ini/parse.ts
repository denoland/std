// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { IniMap, type ReviverFunction } from "./_ini_map.ts";
export type { ReviverFunction };

/** Options for {@linkcode parse}. */
// deno-lint-ignore no-explicit-any
export interface ParseOptions<T = any> {
  /**
   * Provide custom parsing of the value in a key/value pair. Similar to the
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#reviver | reviver}
   * function in {@linkcode JSON.parse}.
   */
  reviver?: ReviverFunction<T>;
}

/**
 * Parse an INI config string into an object.
 *
 * Values are parsed as strings by default to preserve data parity from the
 * original. To parse values as other types besides strings, use
 * {@linkcode ParseOptions.reviver}.
 *
 * Nested sections, repeated key names within a section, and key/value arrays
 * are not supported. White space padding and lines starting with `#`, `;`, or
 * `//` will be treated as comments.
 *
 * @throws {SyntaxError} If the INI string is invalid or if it contains
 * multi-line values.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/ini/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const parsed = parse(`
 * key = value
 *
 * [section 1]
 * foo = Hello
 * baz = World
 * `);
 *
 * assertEquals(parsed, { key: "value", "section 1": { foo: "Hello", baz: "World" } })
 * ```
 *
 * @example Using custom reviver
 * ```ts
 * import { parse } from "@std/ini/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const parsed = parse(`
 * [section Foo]
 * date = 2012-10-10
 * amount = 12345
 * `, {
 *   reviver(key, value, section) {
 *     if (section === "section Foo") {
 *       if (key === "date") {
 *         return new Date(value);
 *       } else if (key === "amount") {
 *         return +value;
 *       }
 *     }
 *     return value;
 *   }
 * });
 *
 * assertEquals(parsed, {
 *   "section Foo": {
 *     date: new Date("2012-10-10"),
 *     amount: 12345,
 *   }
 * })
 * ```
 *
 * @param text The text to parse
 * @param options The options to use
 * @typeParam T The type of the value
 * @return The parsed object
 */
// deno-lint-ignore no-explicit-any
export function parse<T = any>(
  text: string,
  options?: ParseOptions<T>,
): Record<string, T | Record<string, T>> {
  return IniMap.from(text, options).toObject();
}
