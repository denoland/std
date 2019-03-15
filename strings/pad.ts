// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/** FillOption Object */
export interface FillOption {
  /** Char to fill in */
  char: string;
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

/**
 * pad helper for strings. Also resolve substring
 * @param input Input string
 * @param strLen Output string lenght
 * @param opts Configuration object
 * @param [opts.char=" "] Support advanced ext globbing
 * @param [opts.side=Side.Left] Support advanced ext globbing
 * @param [opts.strict=false] Support advanced ext globbing
 * @param [opts.strictChar=""] Support advanced ext globbing
 * @param [opts.strictSide=Side.Right] Support advanced ext globbing
 */
export function pad(
  input: string,
  strLen: number,
  opts: FillOption = {
    char: " ",
    strict: false,
    side: Side.Left,
    strictChar: "",
    strictSide: Side.Right
  }
): string {
  let out = input;
  const outL = out.length;
  if (outL < strLen) {
    if (opts.side === Side.Left) {
      out = out.padStart(strLen, opts.char);
    } else {
      out = out.padEnd(strLen, opts.char);
    }
  } else if (opts.strict && outL > strLen) {
    let addChar = opts.strictChar ? opts.strictChar : "";
    if (opts.strictSide === Side.Left) {
      let toDrop = outL - strLen;
      if (opts.strictChar) {
        toDrop += opts.strictChar.length;
      }
      out = `${addChar}${out.slice(toDrop, outL)}`;
    } else {
      out = `${out.substring(0, strLen - addChar.length)}${addChar}`;
    }
  }
  return out;
}
