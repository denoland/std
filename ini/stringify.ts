// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import {
  type FormattingOptions,
  IniMap,
  type ReplacerFunction,
} from "./_ini_map.ts";

/** Options for {@linkcode stringify}. */
export interface StringifyOptions extends FormattingOptions {
  /** Provide custom string conversion for the value in a key/value pair. */
  replacer?: ReplacerFunction;
}

export type { FormattingOptions, ReplacerFunction };

/**
 * Compile an object into an INI config string. Provide formatting options to modify the output.
 *
 * @example Usage
 * ```ts
 * import { stringify } from "@std/ini/stringify";
 * import { assertEquals } from "@std/assert";
 *
 * const str = stringify({
 *   key1: "value1",
 *   key2: "value2",
 *   section1: {
 *     foo: "bar",
 *   },
 *   section2: {
 *     hello: "world",
 *   },
 * });
 *
 * assertEquals(str, `key1=value1
 * key2=value2
 * [section1]
 * foo=bar
 * [section2]
 * hello=world`);
 * ```
 *
 * @example Using replacer option
 * ```ts
 * import { stringify } from "@std/ini/stringify";
 * import { assertEquals } from "@std/assert";
 *
 * const str = stringify({
 *   "section X": {
 *     date: new Date("2024-06-10"),
 *   },
 *   "section Y": {
 *     name: "John"
 *   }
 * }, {
 *   replacer(key, value, section) {
 *     if (section === "section X" && key === "date") {
 *       return value.toISOString().slice(0, 10);
 *     }
 *     return value;
 *   },
 * });
 *
 * assertEquals(str, `[section X]
 * date=2024-06-10
 * [section Y]
 * name=John`);
 * ```
 *
 * @param object The object to stringify
 * @param options The option to use
 * @returns The INI string
 */
export function stringify(
  // deno-lint-ignore no-explicit-any
  object: any,
  options?: StringifyOptions,
): string {
  return IniMap.from(object, options).toString(options?.replacer);
}
