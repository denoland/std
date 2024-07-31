// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { IniMap, type ReviverFunction } from "./_ini_map.ts";
export type { ReviverFunction };

/**
 * Parse an INI config string into an object.
 *
 * Values are parsed as strings by default to preserve data parity from the
 * original.
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
 * function reviver(key: string, value: string, section?: string): Date | number | string {
 *   if (section === "section Foo") {
 *     if (key === "date") {
 *       return new Date(value);
 *     } else if (key === "amount") {
 *       return +value;
 *     }
 *   }
 *   return value;
 * }
 *
 * const parsed = parse(`
 * [section Foo]
 * date = 2012-10-10
 * amount = 12345
 * `, reviver);
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
 * @param reviver Function for replacing INI values with JavaScript values.
 * @return The parsed object
 */
export function parse(
  text: string,
  reviver: ReviverFunction = (_key, value) => value,
): Record<string, unknown | Record<string, unknown>> {
  return IniMap.from(text, { reviver }).toObject();
}
