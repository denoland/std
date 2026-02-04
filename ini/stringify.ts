// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/** Function for replacing JavaScript values with INI string values. */
export type ReplacerFunction = (
  key: string,
  // deno-lint-ignore no-explicit-any
  value: any,
  section?: string,
) => string;

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

function isPlainObject(object: unknown): object is object {
  return Object.prototype.toString.call(object) === "[object Object]";
}

function sort([_a, valA]: [string, unknown], [_b, valB]: [string, unknown]) {
  if (isPlainObject(valA)) return 1;
  if (isPlainObject(valB)) return -1;
  return 0;
}

function defaultReplacer(_key: string, value: unknown, _section?: string) {
  return `${value}`;
}

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
  object: object,
  options: StringifyOptions = {},
): string {
  const {
    replacer = defaultReplacer,
    pretty = false,
    lineBreak = "\n",
  } = options;
  const assignment = pretty ? " = " : "=";

  const entries = Object.entries(object).sort(sort);

  const lines = [];
  for (const [key, value] of entries) {
    if (isPlainObject(value)) {
      const sectionName = key;
      lines.push(`[${sectionName}]`);
      for (const [key, val] of Object.entries(value)) {
        const line = `${key}${assignment}${replacer(key, val, sectionName)}`;
        lines.push(line);
      }
    } else {
      const line = `${key}${assignment}${replacer(key, value)}`;
      lines.push(line);
    }
  }
  return lines.join(lineBreak);
}
