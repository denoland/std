import { EOL, format } from "https://deno.land/std/fs/eol.ts";
import { BufReader, BufState } from "../../io/bufio.ts";
import { TextProtoReader } from "../../textproto/mod.ts";

export interface CsvParseOptions {
  Comma: string;
  Comment?: string;
  TrimLeadingSpace: boolean;
}

export async function readAll(
  reader: BufReader,
  opt: CsvParseOptions = { Comma: ",", TrimLeadingSpace: false }
): Promise<[string[][], BufState]> {
  const result: string[][] = [];
  let err: BufState;
  let lineResult: string[];
  for (;;) {
    [lineResult, err] = await read(reader, opt);
    if (lineResult.length > 0) {
      result.push(lineResult);
    }
    if (err) break;
  }
  if (err !== "EOF") {
    return [result, err];
  }
  return [result, null];
}

export async function read(
  reader: BufReader,
  opt: CsvParseOptions = { Comma: ",", Comment: "#", TrimLeadingSpace: false }
): Promise<[string[], BufState]> {
  const tp = new TextProtoReader(reader);
  let err: BufState;
  let line: string;
  let result: string[] = [];
  [line, err] = await tp.readLine();
  const trimmedLine = line.trim();
  if (trimmedLine.length === 0) {
    return [[], err];
  }
  // line starting with comment character is ignored
  if (opt.Comment && trimmedLine[0] === opt.Comment) {
    return [result, err];
  }

  result = line.split(opt.Comma);
  if (opt.TrimLeadingSpace) {
    result = result.map(e => e.trimLeft());
  }
  return [result, err];
}
