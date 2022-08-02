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

const QUOTE = '"';
export const NEWLINE = "\r\n";

export class StringifyError extends Error {
  override readonly name = "StringifyError";
}

function getEscapedString(value: unknown, sep: string): string {
  if (value === undefined || value === null) return "";
  let str = "";

  if (typeof value === "object") str = JSON.stringify(value);
  else str = String(value);

  // Is regex.test more performant here? If so, how to dynamically create?
  // https://stackoverflow.com/questions/3561493/
  if (str.includes(sep) || str.includes(NEWLINE) || str.includes(QUOTE)) {
    return `${QUOTE}${str.replaceAll(QUOTE, `${QUOTE}${QUOTE}`)}${QUOTE}`;
  }

  return str;
}

type PropertyAccessor = number | string;

/**
 * @param fn Optional callback for transforming the value
 *
 * @param header Explicit column header name. If omitted,
 * the (final) property accessor is used for this value.
 *
 * @param prop Property accessor(s) used to access the value on the object
 */
export type ColumnDetails = {
  // "unknown" is more type-safe, but inconvenient for user. How to resolve?
  // deno-lint-ignore no-explicit-any
  fn?: (value: any) => string | Promise<string>;
  header?: string;
  prop: PropertyAccessor | PropertyAccessor[];
};

export type Column = ColumnDetails | PropertyAccessor | PropertyAccessor[];

type NormalizedColumn = Omit<ColumnDetails, "header" | "prop"> & {
  header: string;
  prop: PropertyAccessor[];
};

function normalizeColumn(column: Column): NormalizedColumn {
  let fn: NormalizedColumn["fn"],
    header: NormalizedColumn["header"],
    prop: NormalizedColumn["prop"];

  if (typeof column === "object") {
    if (Array.isArray(column)) {
      header = String(column[column.length - 1]);
      prop = column;
    } else {
      ({ fn } = column);
      prop = Array.isArray(column.prop) ? column.prop : [column.prop];
      header = typeof column.header === "string"
        ? column.header
        : String(prop[prop.length - 1]);
    }
  } else {
    header = String(column);
    prop = [column];
  }

  return { fn, header, prop };
}

type ObjectWithStringPropertyKeys = Record<string, unknown>;

/** An object (plain or array) */
export type DataItem = ObjectWithStringPropertyKeys | unknown[];

/**
 * Returns an array of values from an object using the property accessors
 * (and optional transform function) in each column
 */
async function getValuesFromItem(
  item: DataItem,
  normalizedColumns: NormalizedColumn[],
): Promise<unknown[]> {
  const values: unknown[] = [];

  for (const column of normalizedColumns) {
    let value: unknown = item;

    for (const prop of column.prop) {
      if (typeof value !== "object" || value === null) continue;
      if (Array.isArray(value)) {
        if (typeof prop === "number") value = value[prop];
        else {
          throw new StringifyError('Property accessor is not of type "number"');
        }
      } // I think this assertion is safe. Confirm?
      else value = (value as ObjectWithStringPropertyKeys)[prop];
    }

    if (typeof column.fn === "function") value = await column.fn(value);
    values.push(value);
  }

  return values;
}

/**
 * @param headers Whether or not to include the row of headers.
 * Default: `true`
 *
 * @param separator Delimiter used to separate values. Examples:
 *  - `","` _comma_ (Default)
 *  - `"\t"` _tab_
 *  - `"|"` _pipe_
 *  - etc.
 */
export type StringifyOptions = {
  headers?: boolean;
  separator?: string;
};

/**
 * @param data The array of objects to encode
 * @param columns Array of values specifying which data to include in the output
 * @param options Output formatting options
 */
export async function stringify(
  data: DataItem[],
  columns: Column[],
  options: StringifyOptions = {},
): Promise<string> {
  const { headers, separator: sep } = {
    headers: true,
    separator: ",",
    ...options,
  };
  if (sep.includes(QUOTE) || sep.includes(NEWLINE)) {
    const message = [
      "Separator cannot include the following strings:",
      '  - U+0022: Quotation mark (")',
      "  - U+000D U+000A: Carriage Return + Line Feed (\\r\\n)",
    ].join("\n");
    throw new StringifyError(message);
  }

  const normalizedColumns = columns.map(normalizeColumn);
  let output = "";

  if (headers) {
    output += normalizedColumns
      .map((column) => getEscapedString(column.header, sep))
      .join(sep);
    output += NEWLINE;
  }

  for (const item of data) {
    const values = await getValuesFromItem(item, normalizedColumns);
    output += values
      .map((value) => getEscapedString(value, sep))
      .join(sep);
    output += NEWLINE;
  }

  return output;
}

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
