// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { ReviverFunction } from "./_ini_map.ts";
export type { ReviverFunction };

const ASSIGNMENT_MARK = "=";
const NON_WHITESPACE_REGEXP = /\S/;

function trimQuotes(value: string): string {
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

/** Detect supported comment styles. */
function isComment(input: string): boolean {
  return input === "" ||
    input.startsWith("#") ||
    input.startsWith(";") ||
    input.startsWith("//");
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
  const { length } = text;
  let line = "";
  let lineBreak;
  for (let i = 0; i < length; i += 1) {
    const char = text[i]!;

    if (char === "\n" || char === "\r") {
      yield line;
      line = "";
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
        if (!lineBreak) {
          lineBreak = "\r\n";
        }
      } else if (!lineBreak) {
        lineBreak = char;
      }
    } else {
      line += char;
    }
  }

  yield line;
}

interface LineSection {
  type: "section";
  num: number;
  sec: string;
  map: Map<string, LineValue>;
  end: number;
}

interface LineValue {
  type: "value";
  num: number;
  sec?: string;
  key: string;
  // deno-lint-ignore no-explicit-any
  val: any;
}

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
  if (typeof text !== "string") {
    throw new SyntaxError(`Unexpected token ${text} in INI at line 0`);
  }
  const reviverFunc: ReviverFunction = typeof options?.reviver === "function"
    ? options.reviver
    : (_key, value, _section) => {
      if (!isNaN(+value) && !value.includes('"')) return +value;
      if (value === "null") return null;
      if (value === "true" || value === "false") return value === "true";
      return trimQuotes(value);
    };
  let lineNumber = 1;
  let currentSection: LineSection | undefined;
  let pretty;

  const global = new Map<string, LineValue>();
  const sections = new Map<string, LineSection>();

  const lines = [];
  for (const line of readTextLines(text)) {
    const trimmed = line.trim();
    if (isComment(trimmed)) {
      lines.push({
        type: "comment",
        num: lineNumber,
        val: trimmed,
      });
    } else if (isSection(trimmed, lineNumber)) {
      const sec = trimmed.substring(1, trimmed.length - 1);

      if (!NON_WHITESPACE_REGEXP.test(sec)) {
        throw new SyntaxError(
          `Unexpected empty section name at line ${lineNumber}`,
        );
      }

      currentSection = {
        type: "section",
        num: lineNumber,
        sec,
        map: new Map<string, LineValue>(),
        end: lineNumber,
      };
      lines.push(currentSection);
      sections.set(currentSection.sec, currentSection);
    } else {
      const assignmentPos = trimmed.indexOf(ASSIGNMENT_MARK);

      if (assignmentPos === -1) {
        throw new SyntaxError(
          `Unexpected token ${trimmed[0]} in INI at line ${lineNumber}`,
        );
      }
      if (assignmentPos === 0) {
        throw new SyntaxError(
          `Unexpected empty key name at line ${lineNumber}`,
        );
      }

      const leftHand = trimmed.substring(0, assignmentPos);
      const rightHand = trimmed.substring(assignmentPos + 1);

      if (pretty === undefined) {
        pretty = leftHand.endsWith(" ") &&
          rightHand.startsWith(" ");
      }

      const key = leftHand.trim();
      const value = rightHand.trim();

      if (currentSection) {
        const lineValue: LineValue = {
          type: "value",
          num: lineNumber,
          sec: currentSection.sec,
          key,
          val: reviverFunc(key, value, currentSection.sec),
        };
        currentSection.map.set(key, lineValue);
        lines.push(lineValue);
        currentSection.end = lineNumber;
      } else {
        const lineValue: LineValue = {
          type: "value",
          num: lineNumber,
          key,
          val: reviverFunc(key, value),
        };
        global.set(key, lineValue);
        lines.push(lineValue);
      }
    }

    lineNumber += 1;
  }

  const obj: Record<string, T | Record<string, T>> = {};

  for (const { key, val } of global.values()) {
    Object.defineProperty(obj, key, {
      value: val,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  for (const { sec, map } of sections.values()) {
    const section: Record<string, T> = {};
    Object.defineProperty(obj, sec, {
      value: section,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    for (const { key, val } of map.values()) {
      Object.defineProperty(section, key, {
        value: val,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }

  return obj;
}
