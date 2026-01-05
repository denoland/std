// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Reads and writes comma-separated values (CSV) files.
 *
 * ## Parsing CSV
 *
 * ```ts
 * import { parse } from "@std/csv/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const string = "a,b,c\nd,e,f";
 *
 * // Parse as array of arrays (default)
 * assertEquals(parse(string, { skipFirstRow: false }), [["a", "b", "c"], ["d", "e", "f"]]);
 *
 * // Parse csv file with headers into array of objects
 * assertEquals(parse(string, { skipFirstRow: true }), [{ a: "d", b: "e", c: "f" }]);
 *
 * // Parse with custom column names
 * assertEquals(parse(string, { columns: ["x", "y", "z"] }), [
 *   { x: "a", y: "b", z: "c" },
 *   { x: "d", y: "e", z: "f" }
 * ]);
 *
 * // Parse tab-separated values
 * const tsvString = "name\tage\tcity\njohn\t30\tnew york\nmary\t25\tlos angeles";
 * assertEquals(parse(tsvString, { separator: "\t", skipFirstRow: true }), [
 *   { name: "john", age: "30", city: "new york" },
 *   { name: "mary", age: "25", city: "los angeles" }
 * ]);
 *
 * // Parse a CSV file which has comments
 * const csvWithComments = "# This is a comment\nname,age,city\n# Another comment\njohn,30,new york\nmary,25,los angeles";
 * assertEquals(parse(csvWithComments, { comment: "#", skipFirstRow: true }), [
 *   { name: "john", age: "30", city: "new york" },
 *   { name: "mary", age: "25", city: "los angeles" }
 * ]);
 * ```
 * ## Parsing CSV from a Stream
 *
 * ```ts
 * import { CsvParseStream } from "@std/csv/parse-stream";
 * import { assertEquals } from "@std/assert";
 *
 * // Parse from a stream (useful for large files)
 * const source = ReadableStream.from([
 *   "name,age,city\n",
 *   "john,30,new york\n",
 *   "mary,25,los angeles\n"
 * ]);
 *
 * const csvStream = source
 *   .pipeThrough(new CsvParseStream({ skipFirstRow: true }));
 *
 * const records = await Array.fromAsync(csvStream);
 * assertEquals(records, [
 *   { name: "john", age: "30", city: "new york" },
 *   { name: "mary", age: "25", city: "los angeles" }
 * ]);
 *
 * // Or process records one by one
 * // for await (const record of csvStream) {
 * //   console.log(record);
 * // }
 * ```
 *
 * ## Stringifying Data to CSV
 *
 * ```ts
 * import { stringify } from "@std/csv/stringify";
 * import { assertEquals } from "@std/assert";
 *
 * // Convert array of arrays to CSV
 * const arrayData = [["name", "age", "city"], ["john", "30", "new york"], ["mary", "25", "los angeles"]];
 * const csvString = stringify(arrayData);
 * assertEquals(csvString, "name,age,city\r\njohn,30,new york\r\nmary,25,los angeles\r\n");
 *
 * // Convert array of objects to CSV
 * const objectData = [
 *   { name: "john", age: "30", city: "new york" },
 *   { name: "mary", age: "25", city: "los angeles" }
 * ];
 *
 * // When using an array of objects, you must specify columns to use
 * const customColumns = stringify(objectData, { columns: ["city", "name", "age"] });
 * assertEquals(customColumns, "city,name,age\r\nnew york,john,30\r\nlos angeles,mary,25\r\n");
 * ```
 *
 * ## Streaming Stringify Data to CSV
 *
 * ```ts
 * import { CsvStringifyStream } from "@std/csv/stringify-stream";
 * import { assertEquals } from "@std/assert";
 *
 * async function writeCsvToTempFile(): Promise<string> {
 *   const path = await Deno.makeTempFile();
 *   using file = await Deno.open(path, { write: true });
 *
 *   const readable = ReadableStream.from([
 *     { id: 1, name: "one" },
 *     { id: 2, name: "two" },
 *     { id: 3, name: "three" },
 *   ]);
 *
 *   await readable
 *     .pipeThrough(new CsvStringifyStream({ columns: ["id", "name"] }))
 *     .pipeThrough(new TextEncoderStream())
 *     .pipeTo(file.writable);
 *
 *   return path;
 * }
 *
 * const path = await writeCsvToTempFile();
 * const content = await Deno.readTextFile(path);
 * assertEquals(content, "id,name\r\n1,one\r\n2,two\r\n3,three\r\n");
 * ```
 *
 * ## CSV Format Information
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
