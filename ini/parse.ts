// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { IniMap, type ReviverFunction } from "./_ini_map.ts";
export type { ParseOptions, ReviverFunction };

/** Options for {@linkcode parse}. */
interface ParseOptions {
  /** Provide custom parsing of the value in a key/value pair. */
  reviver?: ReviverFunction;
}

/**
 * Parse an INI config string into an object. Provide formatting options to override the default assignment operator.
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
 * @return The parsed object
 */
export function parse(
  text: string,
  options?: ParseOptions,
): Record<string, unknown | Record<string, unknown>> {
  return IniMap.from(text, options).toObject();
}
