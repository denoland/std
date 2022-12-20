// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

// This module is browser compatible.

/** Port of the Go
 * [encoding/csv](https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/)
 * library.
 *
 * @module
 */

import { assert } from "../../_util/asserts.ts";
import type { ReadOptions } from "./_io.ts";
import { Parser } from "./_parser.ts";

export interface ParseOptions extends ReadOptions {
  /**
   * If you provide `skipFirstRow: true` and `columns`, the first line will be
   * skipped.
   * If you provide `skipFirstRow: true` but not `columns`, the first line will
   * be skipped and used as header definitions.
   */
  skipFirstRow?: boolean;

  /** List of names used for header definition. */
  columns?: string[];
}

/**
 * Csv parse helper to manipulate data.
 * Provides an auto/custom mapper for columns.
 *
 * @example
 * ```ts
 * import { parse } from "https://deno.land/std@$STD_VERSION/encoding/csv/mod.ts";
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
    columns: string[];
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
    let headers: string[] = [];
    let i = 0;

    if (opt.skipFirstRow) {
      const head = r.shift();
      assert(head != null);
      headers = head;
      i++;
    }

    if (opt.columns) {
      headers = opt.columns;
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
        out[headers[j]] = e[j];
      }
      return out;
    });
  }
  return r;
}
