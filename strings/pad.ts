// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/** FillOption Object */
export interface FillOption {
  /** Char to fill in */
  char: string;
  /** Final string max lenght */
  strLen: number;
  /** Side to fill in */
  side: Side;
  /** If strict, output string can't be greater than strLen*/
  strict?: boolean;
  /** char/string used to specify the string has been truncated */
  strictChar?: string;
  /** Side of truncate */
  strictSide?: Side;
}

export enum Side {
  Left = "left",
  Right = "right"
}

/** pad helper for strings. Also resolve substring  */
export function pad(input: string, opts: FillOption): string {
  let out = input;
  const outL = out.length;
  if (outL < opts.strLen) {
    if (opts.side === Side.Left) {
      out = out.padStart(opts.strLen, opts.char);
    } else {
      out = out.padEnd(opts.strLen, opts.char);
    }
  } else if (opts.strict && outL > opts.strLen) {
    let addChar = opts.strictChar ? opts.strictChar : "";
    if (opts.strictSide === Side.Left) {
      let toDrop = outL - opts.strLen;
      if (opts.strictChar) {
        toDrop += opts.strictChar.length;
      }
      out = `${addChar}${out.slice(toDrop, outL)}`;
    } else {
      out = `${out.substring(0, opts.strLen - addChar.length)}${addChar}`;
    }
  }
  return out;
}
