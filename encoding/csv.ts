// Ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BufReader, EOF } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";
import { StringReader } from "../io/readers.ts";

const INVALID_RUNE = ["\r", "\n", '"'];

export class ParseError extends Error {
  StartLine: number;
  Line: number;
  constructor(start: number, line: number, message: string) {
    super(message);
    this.StartLine = start;
    this.Line = line;
  }
}

export interface ParseOptions {
  comma?: string;
  comment?: string;
  trimLeadingSpace?: boolean;
  lazyQuotes?: boolean;
  fieldsPerRecord?: number;
}

function chkOptions(opt: ParseOptions): void {
  if (
    INVALID_RUNE.includes(opt.comma!) ||
    INVALID_RUNE.includes(opt.comment!) ||
    opt.comma === opt.comment
  ) {
    throw new Error("Invalid Delimiter");
  }
}

export async function read(
  Startline: number,
  reader: BufReader,
  opt: ParseOptions = { comma: ",", comment: "#", trimLeadingSpace: false }
): Promise<string[] | EOF> {
  const tp = new TextProtoReader(reader);
  let line: string;
  let result: string[] = [];
  let lineIndex = Startline;

  const r = await tp.readLine();
  if (r === EOF) return EOF;
  line = r;
  // Normalize \r\n to \n on all input lines.
  if (
    line.length >= 2 &&
    line[line.length - 2] === "\r" &&
    line[line.length - 1] === "\n"
  ) {
    line = line.substring(0, line.length - 2);
    line = line + "\n";
  }

  const trimmedLine = line.trimLeft();
  if (trimmedLine.length === 0) {
    return [];
  }

  // line starting with comment character is ignored
  if (opt.comment && trimmedLine[0] === opt.comment) {
    return [];
  }

  result = line.split(opt.comma!);

  let quoteError = false;
  result = result.map(
    (r): string => {
      if (opt.trimLeadingSpace) {
        r = r.trimLeft();
      }
      if (r[0] === '"' && r[r.length - 1] === '"') {
        r = r.substring(1, r.length - 1);
      } else if (r[0] === '"') {
        r = r.substring(1, r.length);
      }

      if (!opt.lazyQuotes) {
        if (r[0] !== '"' && r.indexOf('"') !== -1) {
          quoteError = true;
        }
      }
      return r;
    }
  );
  if (quoteError) {
    throw new ParseError(Startline, lineIndex, 'bare " in non-quoted-field');
  }
  return result;
}

export async function readAll(
  reader: BufReader,
  opt: ParseOptions = {
    comma: ",",
    trimLeadingSpace: false,
    lazyQuotes: false
  }
): Promise<string[][]> {
  const result: string[][] = [];
  let _nbFields: number;
  let lineResult: string[];
  let first = true;
  let lineIndex = 0;
  chkOptions(opt);

  for (;;) {
    const r = await read(lineIndex, reader, opt);
    if (r === EOF) break;
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
      if (_nbFields! && _nbFields! !== lineResult.length) {
        throw new ParseError(lineIndex, lineIndex, "wrong number of fields");
      }
      result.push(lineResult);
    }
  }
  return result;
}

/**
 * HeaderOption provides the column definition
 * and the parse function for each entry of the
 * column.
 */
export interface HeaderOption {
  name: string;
  parse?: (input: string) => unknown;
}

export interface ExtendedParseOptions extends ParseOptions {
  header: boolean | string[] | HeaderOption[];
  parse?: (input: unknown) => unknown;
}

/**
 * Csv parse helper to manipulate data.
 * Provides an auto/custom mapper for columns and parse function
 * for columns and rows.
 * @param input Input to parse. Can be a string or BufReader.
 * @param opt options of the parser.
 * @param [opt.header=false] HeaderOptions
 * @param [opt.parse=null] Parse function for rows.
 * Example:
 *     const r = await parseFile('a,b,c\ne,f,g\n', {
 *      header: ["this", "is", "sparta"],
 *       parse: (e: Record<string, unknown>) => {
 *         return { super: e.this, street: e.is, fighter: e.sparta };
 *       }
 *     });
 * // output
 * [
 *   { super: "a", street: "b", fighter: "c" },
 *   { super: "e", street: "f", fighter: "g" }
 * ]
 */
export async function parse(
  input: string | BufReader,
  opt: ExtendedParseOptions = {
    header: false
  }
): Promise<unknown[]> {
  let r: string[][];
  let err: BufState;
  if (input instanceof BufReader) {
    [r, err] = await readAll(input, opt);
  } else {
    [r, err] = await readAll(new BufReader(new StringReader(input)), opt);
  }
  if (err) throw err;
  if (opt.header) {
    let headers: HeaderOption[] = [];
    let i = 0;
    if (Array.isArray(opt.header)) {
      if (typeof opt.header[0] !== "string") {
        headers = opt.header as HeaderOption[];
      } else {
        const h = opt.header as string[];
        headers = h.map(
          (e): HeaderOption => {
            return {
              name: e
            };
          }
        );
      }
    } else {
      headers = r.shift()!.map(
        (e): HeaderOption => {
          return {
            name: e
          };
        }
      );
      i++;
    }
    return r.map(
      (e): unknown => {
        if (e.length !== headers.length) {
          throw `Error number of fields line:${i}`;
        }
        i++;
        let out: Record<string, unknown> = {};
        for (let j = 0; j < e.length; j++) {
          const h = headers[j];
          if (h.parse) {
            out[h.name] = h.parse(e[j]);
          } else {
            out[h.name] = e[j];
          }
        }
        if (opt.parse) {
          return opt.parse(out);
        }
        return out;
      }
    );
  }
  if (opt.parse) {
    return r.map((e: string[]): unknown => opt.parse!(e));
  }
  return r;
}
