// Ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { BufReader } from "../io/buffer.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { StringReader } from "../io/readers.ts";
import { assert } from "../_util/assert.ts";
import {
  ERR_FIELD_COUNT,
  ERR_INVALID_DELIM,
  ParseError,
  readRecord,
} from "./csv/_io.ts";
import type { LineReader, ReadOptions } from "./csv/_io.ts";

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

class TextProtoLineReader implements LineReader {
  #tp: TextProtoReader;
  constructor(bufReader: BufReader) {
    this.#tp = new TextProtoReader(bufReader);
  }

  async readLine() {
    let line: string;
    const r = await this.#tp.readLine();
    if (r === null) return null;
    line = r;

    // For backwards compatibility, drop trailing \r before EOF.
    if (
      (await this.isEOF()) && line.length > 0 && line[line.length - 1] === "\r"
    ) {
      line = line.substring(0, line.length - 1);
    }

    // Normalize \r\n to \n on all input lines.
    if (
      line.length >= 2 &&
      line[line.length - 2] === "\r" &&
      line[line.length - 1] === "\n"
    ) {
      line = line.substring(0, line.length - 2);
      line = line + "\n";
    }

    return line;
  }

  async isEOF() {
    return (await this.#tp.r.peek(0)) === null;
  }
}

const INVALID_RUNE = ["\r", "\n", '"'];

function chkOptions(opt: ReadOptions): void {
  if (!opt.separator) {
    opt.separator = ",";
  }
  if (!opt.trimLeadingSpace) {
    opt.trimLeadingSpace = false;
  }
  if (
    INVALID_RUNE.includes(opt.separator) ||
    (typeof opt.comment === "string" && INVALID_RUNE.includes(opt.comment)) ||
    opt.separator === opt.comment
  ) {
    throw new Error(ERR_INVALID_DELIM);
  }
}

/**
 * Parse the CSV from the `reader` with the options provided and return `string[][]`.
 *
 * @param reader provides the CSV data to parse
 * @param opt controls the parsing behavior
 */
export async function readMatrix(
  reader: BufReader,
  opt: ReadOptions = {
    separator: ",",
    trimLeadingSpace: false,
    lazyQuotes: false,
  },
): Promise<string[][]> {
  const result: string[][] = [];
  let _nbFields: number | undefined;
  let lineResult: string[];
  let first = true;
  let lineIndex = 0;
  chkOptions(opt);

  const lineReader = new TextProtoLineReader(reader);
  for (;;) {
    const r = await readRecord(lineIndex, lineReader, opt);
    if (r === null) break;
    lineResult = r;
    lineIndex++;
    // If fieldsPerRecord is 0, Read sets it to
    // the number of fields in the first record
    if (first) {
      first = false;
      if (opt.fieldsPerRecord !== undefined) {
        if (opt.fieldsPerRecord === 0) {
          _nbFields = lineResult.length;
        } else {
          _nbFields = opt.fieldsPerRecord;
        }
      }
    }

    if (lineResult.length > 0) {
      if (_nbFields && _nbFields !== lineResult.length) {
        throw new ParseError(lineIndex, lineIndex, null, ERR_FIELD_COUNT);
      }
      result.push(lineResult);
    }
  }
  return result;
}

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
 * @param input Input to parse. Can be a string or BufReader.
 * @param opt options of the parser.
 * @returns If you don't provide `opt.skipFirstRow` and `opt.columns`, it returns `string[][]`.
 *   If you provide `opt.skipFirstRow` or `opt.columns`, it returns `Record<string, unkown>[]`.
 */
export async function parse(
  input: string | BufReader,
): Promise<string[][]>;
export async function parse(
  input: string | BufReader,
  opt: Omit<ParseOptions, "columns" | "skipFirstRow">,
): Promise<string[][]>;
export async function parse(
  input: string | BufReader,
  opt: Omit<ParseOptions, "columns"> & {
    columns: string[] | ColumnOptions[];
  },
): Promise<Record<string, unknown>[]>;
export async function parse(
  input: string | BufReader,
  opt: Omit<ParseOptions, "skipFirstRow"> & {
    skipFirstRow: true;
  },
): Promise<Record<string, unknown>[]>;
export async function parse(
  input: string | BufReader,
  opt: ParseOptions,
): Promise<string[][] | Record<string, unknown>[]>;
export async function parse(
  input: string | BufReader,
  opt: ParseOptions = {
    skipFirstRow: false,
  },
): Promise<string[][] | Record<string, unknown>[]> {
  let r: string[][];
  if (input instanceof BufReader) {
    r = await readMatrix(input, opt);
  } else {
    r = await readMatrix(new BufReader(new StringReader(input)), opt);
  }
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
        throw `Error number of fields line:${i}`;
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
