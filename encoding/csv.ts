// Ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

import { BufReader, BufState } from "../io/bufio.ts";
import { TextProtoReader } from "../textproto/mod.ts";

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

export interface CsvParseOptions {
  Comma: string;
  Comment?: string;
  TrimLeadingSpace: boolean;
  LazyQuotes?: boolean;
  FieldsPerRecord?: number;
}

function chkOptions(opt: CsvParseOptions): Error | null {
  if (
    INVALID_RUNE.includes(opt.Comma) ||
    INVALID_RUNE.includes(opt.Comment) ||
    opt.Comma === opt.Comment
  ) {
    return Error("Invalid Delimiter");
  }
  return null;
}

export async function read(
  Startline: number,
  reader: BufReader,
  opt: CsvParseOptions = { Comma: ",", Comment: "#", TrimLeadingSpace: false }
): Promise<[string[], BufState]> {
  const tp = new TextProtoReader(reader);
  let err: BufState;
  let line: string;
  let result: string[] = [];
  let lineIndex = Startline;

  [line, err] = await tp.readLine();

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
    return [[], err];
  }

  // line starting with comment character is ignored
  if (opt.Comment && trimmedLine[0] === opt.Comment) {
    return [result, err];
  }

  result = line.split(opt.Comma);

  let quoteError = false;
  result = result.map(
    (r): string => {
      if (opt.TrimLeadingSpace) {
        r = r.trimLeft();
      }
      if (r[0] === '"' && r[r.length - 1] === '"') {
        r = r.substring(1, r.length - 1);
      } else if (r[0] === '"') {
        r = r.substring(1, r.length);
      }

      if (!opt.LazyQuotes) {
        if (r[0] !== '"' && r.indexOf('"') !== -1) {
          quoteError = true;
        }
      }
      return r;
    }
  );
  if (quoteError) {
    return [
      [],
      new ParseError(Startline, lineIndex, 'bare " in non-quoted-field')
    ];
  }
  return [result, err];
}

export async function readAll(
  reader: BufReader,
  opt: CsvParseOptions = {
    Comma: ",",
    TrimLeadingSpace: false,
    LazyQuotes: false
  }
): Promise<[string[][], BufState]> {
  const result: string[][] = [];
  let _nbFields: number;
  let err: BufState;
  let lineResult: string[];
  let first = true;
  let lineIndex = 0;
  err = chkOptions(opt);
  if (err) return [result, err];

  for (;;) {
    [lineResult, err] = await read(lineIndex, reader, opt);
    if (err) break;
    lineIndex++;
    // If FieldsPerRecord is 0, Read sets it to
    // the number of fields in the first record
    if (first) {
      first = false;
      if (opt.FieldsPerRecord !== undefined) {
        if (opt.FieldsPerRecord === 0) {
          _nbFields = lineResult.length;
        } else {
          _nbFields = opt.FieldsPerRecord;
        }
      }
    }

    if (lineResult.length > 0) {
      if (_nbFields && _nbFields !== lineResult.length) {
        return [
          null,
          new ParseError(lineIndex, lineIndex, "wrong number of fields")
        ];
      }
      result.push(lineResult);
    }
  }
  if (err !== "EOF") {
    return [result, err];
  }
  return [result, null];
}
