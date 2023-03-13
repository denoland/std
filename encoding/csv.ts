// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/** Port of the Go
 * [encoding/csv](https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/)
 * library.
 *
 * @module
 */

export {
  /**
   * @deprecated (will be removed after 0.181.0) Import from `csv/stringify.ts` instead.
   *
   * The most essential aspect of a column is accessing the property holding the
   * data for that column on each object in the data array. If that member is at
   * the top level, `Column` can simply be a property accessor, which is either a
   * `string` (if it's a plain object) or a `number` (if it's an array).
   *
   * ```ts
   * const columns = [
   *   "name",
   * ];
   * ```
   *
   * Each property accessor will be used as the header for the column:
   *
   * | name |
   * | :--: |
   * | Deno |
   *
   * - If the required data is not at the top level (it's nested in other
   *   objects/arrays), then a simple property accessor won't work, so an array of
   *   them will be required.
   *
   *   ```ts
   *   const columns = [
   *     ["repo", "name"],
   *     ["repo", "org"],
   *   ];
   *   ```
   *
   *   When using arrays of property accessors, the header names inherit the value
   *   of the last accessor in each array:
   *
   *   | name |   org    |
   *   | :--: | :------: |
   *   | deno | denoland |
   *
   *  - If a different column header is desired, then a `ColumnDetails` object type
   *     can be used for each column:
   *
   *   - **`header?: string`** is the optional value to use for the column header
   *     name
   *
   *   - **`prop: PropertyAccessor | PropertyAccessor[]`** is the property accessor
   *     (`string` or `number`) or array of property accessors used to access the
   *     data on each object
   *
   *   ```ts
   *   const columns = [
   *     "name",
   *     {
   *       prop: ["runsOn", 0],
   *       header: "language 1",
   *     },
   *     {
   *       prop: ["runsOn", 1],
   *       header: "language 2",
   *     },
   *   ];
   *   ```
   *
   *   | name | language 1 | language 2 |
   *   | :--: | :--------: | :--------: |
   *   | Deno |    Rust    | TypeScript |
   */

  type Column,
  /**
   * @deprecated (will be removed after 0.181.0) Import from `csv/stringify.ts` instead.
   *
   * @param header Explicit column header name. If omitted,
   * the (final) property accessor is used for this value.
   *
   * @param prop Property accessor(s) used to access the value on the object
   */
  type ColumnDetails,
  /**
   * @deprecated (will be removed after 0.181.0) Import from `csv/stringify.ts` instead.

   *
   * An object (plain or array)
   **/

  type DataItem,
  ERR_BARE_QUOTE,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead. */
  ERR_FIELD_COUNT,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead. */
  ERR_INVALID_DELIM,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead. */
  ERR_QUOTE,
  /**
   * @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead.
   *
   * CSV parse helper to manipulate data.
   * Provides an auto/custom mapper for columns.
   *
   * @example
   * ```ts
   * import { parse } from "https://deno.land/std@$STD_VERSION/encoding/csv.ts";
   * const string = "a,b,c\nd,e,f";
   *
   * console.log(
   *   await parse(string, {
   *     skipFirstRow: false,
   *   }),
   * );
   * // output:
   * // [["a", "b", "c"], ["d", "e", "f"]]
   * ```
   *
   * @param input Input to parse.
   * @param opt options of the parser.
   * @returns If you don't provide `opt.skipFirstRow` and `opt.columns`, it returns `string[][]`.
   *   If you provide `opt.skipFirstRow` or `opt.columns`, it returns `Record<string, unkown>[]`.
   */
  parse,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead. */
  ParseError,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead. */
  type ParseOptions,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/parse.ts` instead. */
  type ReadOptions,
  /**
   * @deprecated (will be removed after 0.181.0) Import from `csv/stringify.ts` instead.
   *
   * @param data The source data to stringify. It's an array of items which are
   * plain objects or arrays.
   *
   * `DataItem: Record<string, unknown> | unknown[]`
   *
   * ```ts
   * const data = [
   *   {
   *     name: "Deno",
   *     repo: { org: "denoland", name: "deno" },
   *     runsOn: ["Rust", "TypeScript"],
   *   },
   * ];
   * ```
   *
   * @example
   * ```ts
   * import {
   *   Column,
   *   stringify,
   * } from "https://deno.land/std@$STD_VERSION/encoding/csv.ts";
   *
   * type Character = {
   *   age: number;
   *   name: {
   *     first: string;
   *     last: string;
   *   };
   * };
   *
   * const data: Character[] = [
   *   {
   *     age: 70,
   *     name: {
   *       first: "Rick",
   *       last: "Sanchez",
   *     },
   *   },
   *   {
   *     age: 14,
   *     name: {
   *       first: "Morty",
   *       last: "Smith",
   *     },
   *   },
   * ];
   *
   * let columns: Column[] = [
   *   ["name", "first"],
   *   "age",
   * ];
   *
   * console.log(stringify(data, { columns }));
   * // first,age
   * // Rick,70
   * // Morty,14
   * ```
   *
   * @param options Output formatting options
   */
  stringify,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/stringify.ts` instead. */
  StringifyError,
  /** @deprecated (will be removed after 0.181.0) Import from `csv/stringify.ts` instead. */
  type StringifyOptions,
} from "../csv/mod.ts";
