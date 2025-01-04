// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Reads and writes comma-separated values (CSV) files.
 *
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const string = "a,b,c\nd,e,f";
 *
 * assertEquals(parse(string, { skipFirstRow: false }), [["a", "b", "c"], ["d", "e", "f"]]);
 * assertEquals(parse(string, { skipFirstRow: true }), [{ a: "d", b: "e", c: "f" }]);
 * assertEquals(parse(string, { columns: ["x", "y", "z"] }), [{ x: "a", y: "b", z: "c" }, { x: "d", y: "e", z: "f" }]);
 * ```
 *
 * There are many kinds of CSV files; this module supports the format described
 * in {@link https://www.rfc-editor.org/rfc/rfc4180.html | RFC 4180}.
 *
 * A csv file contains zero or more records of one or more fields per record.
 * Each record is separated by the newline character. The final record may
 * optionally be followed by a newline character.
 *
 * ```csv
 * field1,field2,field3
 * ```
 *
 * White space is considered part of a field.
 *
 * Carriage returns before newline characters are silently removed.
 *
 * Blank lines are ignored. A line with only whitespace characters (excluding
 * the ending newline character) is not considered a blank line.
 *
 * Fields which start and stop with the quote character " are called
 * quoted-fields. The beginning and ending quote are not part of the field.
 *
 * The source:
 *
 * ```csv
 * normal string,"quoted-field"
 * ```
 *
 * results in the fields
 *
 * ```ts no-assert
 * [`normal string`, `quoted-field`]
 * ```
 *
 * Within a quoted-field a quote character followed by a second quote character is considered a single quote.
 *
 * ```csv
 * "the ""word"" is true","a ""quoted-field"""
 * ```
 *
 * results in
 *
 * ```ts no-assert
 * [`the "word" is true`, `a "quoted-field"`]
 * ```
 *
 * Newlines and commas may be included in a quoted-field
 *
 * ```csv
 * "Multi-line
 * field","comma is ,"
 * ```
 *
 * results in
 *
 * ```ts no-assert
 * [`Multi-line
 * field`, `comma is ,`]
 * ```
 *
 * @module
 */

export * from "./parse.ts";
export * from "./parse_stream.ts";
export * from "./stringify.ts";
export * from "./stringify_stream.ts";
