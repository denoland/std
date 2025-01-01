// Originally ported from Go:
// https://github.com/golang/go/blob/go1.12.5/src/encoding/csv/
// Copyright 2011 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
// Copyright 2018-2025 the Deno authors. MIT license.

import { codePointLength } from "./_shared.ts";

/** Options for {@linkcode parseRecord}. */
export interface ReadOptions {
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
   * @default {"#"}
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
   * If === 0, it will be set to the number of fields in the first row, so that
   * future rows must have the same field count.
   * If negative, no check is made and records may have a variable number of
   * fields.
   *
   * If the wrong number of fields is in a row, a {@linkcode SyntaxError} is
   * thrown.
   */
  fieldsPerRecord?: number;
}

export interface LineReader {
  readLine(): Promise<string | null>;
  isEOF(): boolean;
}

export async function parseRecord(
  fullLine: string,
  reader: LineReader,
  options: ReadOptions,
  zeroBasedRecordStartLine: number,
  zeroBasedLine: number = zeroBasedRecordStartLine,
): Promise<Array<string>> {
  // line starting with comment character is ignored
  if (options.comment && fullLine[0] === options.comment) {
    return [];
  }

  if (options.separator === undefined) {
    throw new TypeError("Cannot parse record: separator is required");
  }

  let line = fullLine;
  const quote = '"';
  const quoteLen = quote.length;
  const separatorLen = options.separator.length;
  let recordBuffer = "";
  const fieldIndexes = [] as number[];
  parseField: while (true) {
    if (options.trimLeadingSpace) {
      line = line.trimStart();
    }

    if (line.length === 0 || !line.startsWith(quote)) {
      // Non-quoted string field
      const i = line.indexOf(options.separator);
      let field = line;
      if (i >= 0) {
        field = field.substring(0, i);
      }
      // Check to make sure a quote does not appear in field.
      if (!options.lazyQuotes) {
        const j = field.indexOf(quote);
        if (j >= 0) {
          const col = codePointLength(
            fullLine.slice(0, fullLine.length - line.slice(j).length),
          );
          throw new SyntaxError(
            createBareQuoteErrorMessage(
              zeroBasedRecordStartLine,
              zeroBasedLine,
              col,
            ),
          );
        }
      }
      recordBuffer += field;
      fieldIndexes.push(recordBuffer.length);
      if (i >= 0) {
        line = line.substring(i + separatorLen);
        continue parseField;
      }
      break parseField;
    } else {
      // Quoted string field
      line = line.substring(quoteLen);
      while (true) {
        const i = line.indexOf(quote);
        if (i >= 0) {
          // Hit next quote.
          recordBuffer += line.substring(0, i);
          line = line.substring(i + quoteLen);
          if (line.startsWith(quote)) {
            // `""` sequence (append quote).
            recordBuffer += quote;
            line = line.substring(quoteLen);
          } else if (line.startsWith(options.separator)) {
            // `","` sequence (end of field).
            line = line.substring(separatorLen);
            fieldIndexes.push(recordBuffer.length);
            continue parseField;
          } else if (0 === line.length) {
            // `"\n` sequence (end of line).
            fieldIndexes.push(recordBuffer.length);
            break parseField;
          } else if (options.lazyQuotes) {
            // `"` sequence (bare quote).
            recordBuffer += quote;
          } else {
            // `"*` sequence (invalid non-escaped quote).
            const col = codePointLength(
              fullLine.slice(0, fullLine.length - line.length - quoteLen),
            );
            throw new SyntaxError(
              createQuoteErrorMessage(
                zeroBasedRecordStartLine,
                zeroBasedLine,
                col,
              ),
            );
          }
        } else if (line.length > 0 || !reader.isEOF()) {
          // Hit end of line (copy all data so far).
          recordBuffer += line;
          const r = await reader.readLine();
          line = r ?? ""; // This is a workaround for making this module behave similarly to the encoding/csv/reader.go.
          fullLine = line;
          if (r === null) {
            // Abrupt end of file (EOF or error).
            if (!options.lazyQuotes) {
              const col = codePointLength(fullLine);
              throw new SyntaxError(
                createQuoteErrorMessage(
                  zeroBasedRecordStartLine,
                  zeroBasedLine,
                  col,
                ),
              );
            }
            fieldIndexes.push(recordBuffer.length);
            break parseField;
          }
          zeroBasedLine++;
          recordBuffer += "\n"; // preserve line feed (This is because TextProtoReader removes it.)
        } else {
          // Abrupt end of file (EOF on error).
          if (!options.lazyQuotes) {
            const col = codePointLength(fullLine);
            throw new SyntaxError(
              createQuoteErrorMessage(
                zeroBasedRecordStartLine,
                zeroBasedLine,
                col,
              ),
            );
          }
          fieldIndexes.push(recordBuffer.length);
          break parseField;
        }
      }
    }
  }
  const result = [] as string[];
  let preIdx = 0;
  for (const i of fieldIndexes) {
    result.push(recordBuffer.slice(preIdx, i));
    preIdx = i;
  }
  return result;
}

export function createBareQuoteErrorMessage(
  zeroBasedRecordStartLine: number,
  zeroBasedLine: number,
  zeroBasedColumn: number,
) {
  return `Syntax error on line ${
    zeroBasedRecordStartLine + 1
  }; parse error on line ${zeroBasedLine + 1}, column ${
    zeroBasedColumn + 1
  }: bare " in non-quoted-field`;
}
export function createQuoteErrorMessage(
  zeroBasedRecordStartLine: number,
  zeroBasedLine: number,
  zeroBasedColumn: number,
) {
  return `Syntax error on line ${
    zeroBasedRecordStartLine + 1
  }; parse error on line ${zeroBasedLine + 1}, column ${
    zeroBasedColumn + 1
  }: extraneous or missing " in quoted-field`;
}

export function convertRowToObject(
  row: readonly string[],
  headers: readonly string[],
  zeroBasedLine: number,
) {
  if (row.length !== headers.length) {
    throw new Error(
      `Syntax error on line ${
        zeroBasedLine + 1
      }: The record has ${row.length} fields, but the header has ${headers.length} fields`,
    );
  }
  const out: Record<string, unknown> = {};
  for (const [index, header] of headers.entries()) {
    out[header] = row[index];
  }
  return out;
}

/** Parse result type for {@linkcode parse} and {@linkcode CsvParseStream}. */
export type ParseResult<ParseOptions, T> =
  // If `columns` option is specified, the return type is Record type.
  T extends ParseOptions & { columns: readonly (infer C extends string)[] }
    ? RecordWithColumn<C>[]
    // If `skipFirstRow` option is specified, the return type is Record type.
    : T extends ParseOptions & { skipFirstRow: true } ? Record<string, string>[]
    // If `columns` and `skipFirstRow` option is _not_ specified, the return type is string[][].
    : T extends
      ParseOptions & { columns?: undefined; skipFirstRow?: false | undefined }
      ? string[][]
    // else, the return type is Record type or string[][].
    : Record<string, string>[] | string[][];

/**
 * Record type with column type.
 *
 * @example
 * ```
 * type RecordWithColumn<"aaa"|"bbb"> => Record<"aaa"|"bbb", string>
 * type RecordWithColumn<string> => Record<string, string | undefined>
 * ```
 */
export type RecordWithColumn<C extends string> = string extends C
  ? Record<string, string>
  : Record<C, string>;
