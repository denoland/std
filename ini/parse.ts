// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** Function for replacing INI values with JavaScript values. */
export type ReviverFunction = (
  key: string,
  value: string | number | boolean | null,
  section?: string,
) => unknown;

const SECTION_REGEXP = /^\[(?<name>.*\S.*)]$/;
const KEY_VALUE_REGEXP = /^(?<key>.*?)\s*=\s*(?<value>.*?)$/;

/** Detect supported comment styles. */
function isComment(input: string): boolean {
  return (
    input.startsWith("#") ||
    input.startsWith(";") ||
    input.startsWith("//")
  );
}

/** Detect a section start. */
function isSection(input: string, lineNumber: number): boolean {
  if (input.startsWith("[")) {
    if (input.endsWith("]")) {
      return true;
    }
    throw new SyntaxError(
      `Unexpected end of INI section at line ${lineNumber}`,
    );
  }
  return false;
}

function* readTextLines(text: string): Generator<string> {
  let line = "";
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    switch (char) {
      case "\n":
        yield line;
        line = "";
        break;
      case "\r":
        yield line;
        line = "";
        if (text[i + 1] === "\n") i += 1;
        break;
      default:
        line += char;
        break;
    }
  }
  yield line;
}

/** Options for {@linkcode parse}. */
export interface ParseOptions {
  /**
   * Provide custom parsing of the value in a key/value pair. Similar to the
   * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse#reviver | reviver}
   * function in {@linkcode JSON.parse}.
   */
  reviver?: ReviverFunction;
}

const QUOTED_VALUE_REGEXP = /^"(?<value>.*)"$/;
function defaultReviver(_key: string, value: string, _section?: string) {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  const match = value.match(QUOTED_VALUE_REGEXP);
  if (match) return match.groups?.value as string;
  if (!isNaN(+value)) return +value;
  return value;
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
 * amount = "12345"
 * `, {
 *   reviver(key, value, section) {
 *     if (section === "section Foo") {
 *       if (key === "date") {
 *         return new Date(String(value));
 *       } else if (key === "amount") {
 *         return Number(value);
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
export function parse<T extends object>(
  text: string,
  options: ParseOptions = {},
): T {
  if (typeof text !== "string") {
    throw new SyntaxError(`Unexpected token ${text} in INI at line 0`);
  }

  const root = {} as T;
  let object: object = root;
  let sectionName: string | undefined;

  let lineNumber = 0;
  for (let line of readTextLines(text)) {
    line = line.trim();
    lineNumber += 1;

    // skip empty lines
    if (line === "") continue;

    // skip comment
    if (isComment(line)) continue;

    if (isSection(line, lineNumber)) {
      sectionName = SECTION_REGEXP.exec(line)?.groups?.name;
      if (!sectionName) {
        throw new SyntaxError(
          `Unexpected empty section name at line ${lineNumber}`,
        );
      }

      object = {};
      Object.defineProperty(root, sectionName, {
        value: object,
        writable: true,
        enumerable: true,
        configurable: true,
      });

      continue;
    }

    const groups = KEY_VALUE_REGEXP.exec(line)?.groups;

    if (!groups) {
      throw new SyntaxError(
        `Unexpected token ${line[0]} in INI at line ${lineNumber}`,
      );
    }

    const { key, value } = groups as { key: string; value: string };
    if (!key.length) {
      throw new SyntaxError(`Unexpected empty key name at line ${lineNumber}`);
    }

    const parsedValue = defaultReviver(key, value, sectionName);

    const val = options.reviver
      ? options.reviver(key, parsedValue, sectionName)
      : parsedValue;

    Object.defineProperty(object, key, {
      value: val,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  return root;
}
