// Ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// This module is browser compatible.

import { assert } from "../_util/assert.ts";
import type { ReadOptions } from "./csv/_io.ts";
import { Parser } from "./csv/_parser.ts";

export {
  ERR_BARE_QUOTE,
  ERR_FIELD_COUNT,
  ERR_INVALID_DELIM,
  ERR_QUOTE,
  ParseError,
} from "./csv/_io.ts";
export type { ReadOptions } from "./csv/_io.ts";
export { NEWLINE, stringify, StringifyError } from "./csv_stringify.ts";

export type {
  Column,
  ColumnDetails,
  DataItem,
  StringifyOptions,
} from "./csv_stringify.ts";

/**
 * Parse the CSV string/buffer with the options provided.
 *
 * ColumnOptions provides the column definition
 * and the parse function for each entry of the
 * column.
 */
export interface ColumnOptions {
  /**
   * Name of the column to be used as property
   */
  name: string;
}

export interface ParseOptions extends ReadOptions {
  /**
   * If you provide `skipFirstRow: true` and `columns`, the first line will be skipped.
   * If you provide `skipFirstRow: true` but not `columns`, the first line will be skipped and used as header definitions.
   */
  skipFirstRow?: boolean;

  /**
   * If you provide `string[]` or `ColumnOptions[]`, those names will be used for header definition.
   */
  columns?: string[] | ColumnOptions[];
}

/**
 * Csv parse helper to manipulate data.
 * Provides an auto/custom mapper for columns.
 * @param input Input to parse.
 * @param opt options of the parser.
 * @returns If you don't provide `opt.skipFirstRow` and `opt.columns`, it returns `string[][]`.
 *   If you provide `opt.skipFirstRow` or `opt.columns`, it returns `Record<string, unkown>[]`.
 */
export function parse(
  input: string,
): string[][];
export function parse(
  input: string,
  opt: Omit<ParseOptions, "columns" | "skipFirstRow">,
): string[][];
export function parse(
  input: string,
  opt: Omit<ParseOptions, "columns"> & {
    columns: string[] | ColumnOptions[];
  },
): Record<string, unknown>[];
export function parse(
  input: string,
  opt: Omit<ParseOptions, "skipFirstRow"> & {
    skipFirstRow: true;
  },
): Record<string, unknown>[];
export function parse(
  input: string,
  opt: ParseOptions,
): string[][] | Record<string, unknown>[];
export function parse(
  input: string,
  opt: ParseOptions = {
    skipFirstRow: false,
  },
): string[][] | Record<string, unknown>[] {
  const parser = new Parser(opt);
  const r = parser.parse(input);

  if (opt.skipFirstRow || opt.columns) {
    let headers: ColumnOptions[] = [];
    let i = 0;

    if (opt.skipFirstRow) {
      const head = r.shift();
      assert(head != null);
      headers = head.map(
        (e): ColumnOptions => {
          return {
            name: e,
          };
        },
      );
      i++;
    }

    if (opt.columns) {
      if (typeof opt.columns[0] !== "string") {
        headers = opt.columns as ColumnOptions[];
      } else {
        const h = opt.columns as string[];
        headers = h.map(
          (e): ColumnOptions => {
            return {
              name: e,
            };
          },
        );
      }
    }

    return r.map((e) => {
      if (e.length !== headers.length) {
        throw new Error(
          `Error number of fields line: ${i}\nNumber of fields found: ${headers.length}\nExpected number of fields: ${e.length}`,
        );
      }
      i++;
      const out: Record<string, unknown> = {};
      for (let j = 0; j < e.length; j++) {
        out[headers[j].name] = e[j];
      }
      return out;
    });
  }
  return r;
}
