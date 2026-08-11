// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import {
  convertRowToObject,
  parseLine as parseLineInternal,
  type ParseResult,
  type ReadOptions,
  type RecordWithColumn,
} from "./_io.ts";

export type { ParseResult, RecordWithColumn };

const BYTE_ORDER_MARK = "﻿";

/**
 * Parse a single CSV record into its fields.
 *
 * `parseLine` is the synchronous primitive that `parse` and `CsvParseStream`
 * are both built on. It is exported so callers that already own line
 * splitting (for example, after `TextLineStream`) can reuse the same field
 * rules without spinning up a parser class.
 *
 * Multi-line quoted fields are supported: pass the joined record (each
 * source line separated by `\n`) and the function will treat the embedded
 * newlines as field content.
 *
 * @example Usage
 * ```ts
 * import { parseLine } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(parseLine("a,b,c"), ["a", "b", "c"]);
 * assertEquals(parseLine(`"a","b,c","d"`), ["a", "b,c", "d"]);
 * ```
 *
 * @example Custom separator
 * ```ts
 * import { parseLine } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * assertEquals(parseLine("a\tb\tc", { separator: "\t" }), ["a", "b", "c"]);
 * ```
 *
 * @param line The single CSV record to parse. May contain embedded `\n`
 * characters inside quoted fields.
 * @param options Parsing options. Same shape as the read-side options
 * accepted by {@linkcode parse}.
 * @returns The fields parsed from the record.
 */
export function parseLine(
  line: string,
  options: Omit<ParseOptions, "skipFirstRow" | "columns" | "fieldsPerRecord"> =
    {},
): string[] {
  const { separator = ",", trimLeadingSpace = false, comment, lazyQuotes } =
    options;
  const stripped = line.startsWith(BYTE_ORDER_MARK) ? line.slice(1) : line;
  // Treat a single trailing CR/LF/CRLF as a record terminator (callers that
  // forgot to trim should not see a phantom empty trailing field).
  const normalized = stripped.endsWith("\r\n")
    ? stripped.slice(0, -2)
    : stripped.endsWith("\n") || stripped.endsWith("\r")
    ? stripped.slice(0, -1)
    : stripped;
  const readOptions: ReadOptions = {
    separator,
    trimLeadingSpace,
    ...(comment !== undefined ? { comment } : {}),
    ...(lazyQuotes !== undefined ? { lazyQuotes } : {}),
  };
  const result = parseLineInternal(normalized, readOptions, 0, true);
  return result ?? [];
}

class Parser {
  #input = "";
  #cursor = 0;
  #options: {
    separator: string;
    trimLeadingSpace: boolean;
    comment?: string;
    lazyQuotes?: boolean;
    fieldsPerRecord?: number;
  };
  constructor({
    separator = ",",
    trimLeadingSpace = false,
    comment,
    lazyQuotes,
    fieldsPerRecord,
  }: ReadOptions = {}) {
    this.#options = {
      separator,
      trimLeadingSpace,
      ...(comment !== undefined ? { comment } : {}),
      ...(lazyQuotes !== undefined ? { lazyQuotes } : {}),
      ...(fieldsPerRecord !== undefined ? { fieldsPerRecord } : {}),
    };
  }
  #readLine(): string | null {
    if (this.#isEOF()) return null;

    let buffer = "";
    let hadNewline = false;
    while (this.#cursor < this.#input.length) {
      if (this.#input.startsWith("\r\n", this.#cursor)) {
        hadNewline = true;
        this.#cursor += 2;
        break;
      }
      if (
        this.#input.startsWith("\n", this.#cursor)
      ) {
        hadNewline = true;
        this.#cursor += 1;
        break;
      }
      buffer += this.#input[this.#cursor];
      this.#cursor += 1;
    }
    if (!hadNewline && buffer.endsWith("\r")) {
      buffer = buffer.slice(0, -1);
    }

    return buffer;
  }
  #isEOF(): boolean {
    return this.#cursor >= this.#input.length;
  }
  #parseRecord(zeroBasedStartLine: number): string[] | null {
    const first = this.#readLine();
    if (first === null) return null;
    if (first.length === 0) {
      return [];
    }

    // Defer all field-level parsing to the shared primitive. If the line ends
    // inside an unclosed quoted field, accumulate the next line and re-parse;
    // we own line iteration here, so the primitive's `atEof` signal tells us
    // when to give up.
    let accumulated = first;
    while (true) {
      const result = parseLineInternal(
        accumulated,
        this.#options,
        zeroBasedStartLine,
        this.#isEOF(),
      );
      if (result !== null) return result;
      const next = this.#readLine();
      if (next === null) {
        // Force the EOF decision (will throw unless lazyQuotes is set).
        return parseLineInternal(
          accumulated,
          this.#options,
          zeroBasedStartLine,
          true,
        ) ?? [];
      }
      accumulated += "\n" + next;
    }
  }
  parse(input: string): string[][] {
    this.#input = input.startsWith(BYTE_ORDER_MARK) ? input.slice(1) : input;
    this.#cursor = 0;
    const result: string[][] = [];

    let lineResult: string[];
    let first = true;
    let lineIndex = 0;

    const INVALID_RUNE = ["\r", "\n", '"'];

    const options = this.#options;
    if (
      INVALID_RUNE.includes(options.separator) ||
      (typeof options.comment === "string" &&
        INVALID_RUNE.includes(options.comment)) ||
      options.separator === options.comment
    ) {
      throw new Error("Cannot parse input: invalid delimiter");
    }

    // The number of fields per record that is either inferred from the first
    // row (when options.fieldsPerRecord = 0), or set by the caller (when
    // options.fieldsPerRecord > 0).
    //
    // Each possible variant means the following:
    // "ANY": Variable number of fields is allowed.
    // "UNINITIALIZED": The first row has not been read yet. Once it's read, the
    //                  number of fields will be set.
    // <number>: The number of fields per record that every record must follow.
    let _nbFields: "ANY" | "UNINITIALIZED" | number;
    if (options.fieldsPerRecord === undefined || options.fieldsPerRecord < 0) {
      _nbFields = "ANY";
    } else if (options.fieldsPerRecord === 0) {
      _nbFields = "UNINITIALIZED";
    } else {
      _nbFields = options.fieldsPerRecord;
    }

    while (true) {
      const r = this.#parseRecord(lineIndex);
      if (r === null) break;
      lineResult = r;
      lineIndex++;
      // If fieldsPerRecord is 0, Read sets it to
      // the number of fields in the first record
      if (first) {
        first = false;
        if (_nbFields === "UNINITIALIZED") {
          _nbFields = lineResult.length;
        }
      }

      if (lineResult.length > 0) {
        if (typeof _nbFields === "number" && _nbFields !== lineResult.length) {
          throw new SyntaxError(
            `Syntax error on line ${lineIndex}: expected ${_nbFields} fields but got ${lineResult.length}`,
          );
        }
        result.push(lineResult);
      }
    }
    return result;
  }
}

/** Options for {@linkcode parse}. */
export interface ParseOptions {
  /** Character which separates values.
   *
   * @default {","}
   */
  separator?: string;
  /** Character to start a comment.
   *
   * Lines beginning with the comment character without preceding whitespace
   * are ignored. With leading whitespace the comment character becomes part of
   * the field, even you provide `trimLeadingSpace: true`.
   *
   * By default, no character is considered to be a start of a comment.
   */
  comment?: string;
  /** Flag to trim the leading space of the value.
   *
   * This is done even if the field delimiter, `separator`, is white space.
   *
   * @default {false}
   */
  trimLeadingSpace?: boolean;
  /**
   * Allow unquoted quote in a quoted field or non-double-quoted quotes in
   * quoted field.
   *
   * @default {false}
   */
  lazyQuotes?: boolean;
  /**
   * Enabling checking number of expected fields for each row.
   *
   * If positive, each record is required to have the given number of fields.
   * If 0, it will be set to the number of fields in the first row, so that
   * future rows must have the same field count.
   * If negative, no check is made and records may have a variable number of
   * fields.
   *
   * If the wrong number of fields is in a row, a {@linkcode SyntaxError} is
   * thrown.
   */
  fieldsPerRecord?: number;
  /**
   * If you provide `skipFirstRow: true` and `columns`, the first line will be
   * skipped.
   * If you provide `skipFirstRow: true` but not `columns`, the first line will
   * be skipped and used as header definitions.
   *
   * @default {false}
   */
  skipFirstRow?: boolean;

  /** List of names used for header definition. */
  columns?: readonly string[];
}

/**
 * Parses CSV string into an array of arrays of strings.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const string = "a,b,c\n#d,e,f";
 *
 * assertEquals(parse(string), [["a", "b", "c"], ["#d", "e", "f"]]);
 * ```
 *
 * @example Quoted fields
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const string = `"a ""word""","comma,","newline\n"\nfoo,bar,baz`;
 * const result = parse(string);
 *
 * assertEquals(result, [
 *   ['a "word"', "comma,", "newline\n"],
 *   ["foo", "bar", "baz"]
 * ]);
 * ```
 *
 * @param input The input to parse.
 * @returns The parsed data.
 */
export function parse(input: string): string[][];
/**
 * Parses CSV string into an array of objects or an array of arrays of strings.
 *
 * If `columns` or `skipFirstRow` option is provided, it returns an array of
 * objects, otherwise it returns an array of arrays of string.
 *
 * @example Don't skip first row with `skipFirstRow: false`
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 * import { assertType, IsExact } from "@std/testing/types"
 *
 * const string = "a,b,c\nd,e,f";
 * const result = parse(string, { skipFirstRow: false });
 *
 * assertEquals(result, [["a", "b", "c"], ["d", "e", "f"]]);
 * assertType<IsExact<typeof result, string[][]>>(true);
 * ```
 *
 * @example Skip first row with `skipFirstRow: true`
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 * import { assertType, IsExact } from "@std/testing/types"
 *
 * const string = "a,b,c\nd,e,f";
 * const result = parse(string, { skipFirstRow: true });
 *
 * assertEquals(result, [{ a: "d", b: "e", c: "f" }]);
 * assertType<IsExact<typeof result, Record<string, string>[]>>(true);
 * ```
 *
 * @example Specify columns with `columns` option
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 * import { assertType, IsExact } from "@std/testing/types"
 *
 * const string = "a,b,c\nd,e,f";
 * const result = parse(string, { columns: ["x", "y", "z"] });
 *
 * assertEquals(result, [{ x: "a", y: "b", z: "c" }, { x: "d", y: "e", z: "f" }]);
 * assertType<IsExact<typeof result, Record<"x" | "y" | "z", string>[]>>(true);
 * ```
 *
 * @example Specify columns with `columns` option and skip first row with
 * `skipFirstRow: true`
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 * import { assertType, IsExact } from "@std/testing/types"
 *
 * const string = "a,b,c\nd,e,f";
 * const result = parse(string, { columns: ["x", "y", "z"], skipFirstRow: true });
 *
 * assertEquals(result, [{ x: "d", y: "e", z: "f" }]);
 * assertType<IsExact<typeof result, Record<"x" | "y" | "z", string>[]>>(true);
 * ```
 *
 * @example TSV (tab-separated values) with `separator: "\t"`
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const string = "a\tb\tc\nd\te\tf";
 * const result = parse(string, { separator: "\t" });
 *
 * assertEquals(result, [["a", "b", "c"], ["d", "e", "f"]]);
 * ```
 *
 * @example Trim leading space with `trimLeadingSpace: true`
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const string = " a,  b,    c\n";
 * const result = parse(string, { trimLeadingSpace: true });
 *
 * assertEquals(result, [["a", "b", "c"]]);
 * ```
 *
 * @example Lazy quotes with `lazyQuotes: true`
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const string = `a "word","1"2",a","b`;
 * const result = parse(string, { lazyQuotes: true });
 *
 * assertEquals(result, [['a "word"', '1"2', 'a"', 'b']]);
 * ```
 *
 * @example Set comment prefix with `comment` option
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert/equals";
 *
 * const string = "a,b,c\n# THIS IS A COMMENT LINE\nd,e,f";
 * const result = parse(string, { comment: "#" });
 *
 * assertEquals(result, [["a", "b", "c"], ["d", "e", "f"]]);
 * ```
 *
 * @example Infer the number of fields from the first row with `fieldsPerRecord: 0`
 *  ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertThrows } from "@std/assert/throws";
 *
 * // Note that the second row has more fields than the first row
 * const string = "a,b\nc,d,e";
 * assertThrows(
 *   () => parse(string, { fieldsPerRecord: 0 }),
 *   SyntaxError,
 *   "Syntax error on line 2: expected 2 fields but got 3",
 * );
 * ```
 *
 * @example Enforce the number of fields for each row with `fieldsPerRecord: 2`
 *  ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertThrows } from "@std/assert/throws";
 *
 * const string = "a,b\nc,d,e";
 * assertThrows(
 *   () => parse(string, { fieldsPerRecord: 2 }),
 *   SyntaxError,
 *   "Syntax error on line 2: expected 2 fields but got 3",
 * );
 * ```
 *
 * @typeParam T The options' type for parsing.
 * @param input The input to parse.
 * @param options The options for parsing.
 * @returns If you don't provide `options.skipFirstRow` or `options.columns`, it
 * returns `string[][]`. If you provide `options.skipFirstRow` or
 * `options.columns`, it returns `Record<string, string>[]`.
 */
export function parse<const T extends ParseOptions>(
  input: string,
  options: T,
): ParseResult<ParseOptions, T>;
export function parse<const T extends ParseOptions>(
  input: string,
  options: T = { skipFirstRow: false } as T,
): ParseResult<ParseOptions, T> {
  const parser = new Parser(options);
  const r = parser.parse(input);

  if (options.skipFirstRow || options.columns) {
    let headers: readonly string[] = [];

    if (options.skipFirstRow) {
      const head = r.shift();
      if (head === undefined) {
        throw new TypeError("Cannot parse input: headers must be defined");
      }
      headers = head;
    }

    if (options.columns) {
      headers = options.columns;
    }

    const zeroBasedFirstLineIndex = options.skipFirstRow ? 1 : 0;
    return r.map((row, i) => {
      return convertRowToObject(row, headers, zeroBasedFirstLineIndex + i);
    }) as ParseResult<ParseOptions, T>;
  }
  return r as ParseResult<ParseOptions, T>;
}
