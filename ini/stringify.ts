// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { IniMap, type ReplacerFunction } from "./_ini_map.ts";

/** Options for {@linkcode stringify}. */
export interface StringifyOptions {
  /**
   * Character(s) used to break lines in the config file.
   *
   * @default {"\n"}
   */
  lineBreak?: "\n" | "\r\n" | "\r";
  /**
   * Use a plain assignment char or pad with spaces.
   *
   * @default {false}
   */
  pretty?: boolean;
  /**
   * Provide custom string conversion for the value in a key/value pair.
   * Similar to the
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#replacer | replacer}
   * function in {@linkcode JSON.stringify}.
   */
  replacer?: ReplacerFunction;
}

export type { ReplacerFunction };

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
