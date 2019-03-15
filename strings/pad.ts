// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/** FillOption Object */
export interface FillOption {
  /** Char to fill in */
  char: string;
  /** Side to fill in */
  side: "left" | "right";
  /** If strict, output string can't be greater than strLen*/
  strict?: boolean;
  /** char/string used to specify the string has been truncated */
  strictChar?: string;
  /** Side of truncate */
  strictSide?: "left" | "right";
}

/**
 * pad helper for strings. Also resolve substring
 * @param input Input string
 * @param strLen Output string lenght
 * @param opts Configuration object
 * @param [opts.char=" "] Support advanced ext globbing
 * @param [opts.side="left"] Support advanced ext globbing
 * @param [opts.strict=false] Support advanced ext globbing
 * @param [opts.strictChar=""] Support advanced ext globbing
 * @param [opts.strictSide="right"] Support advanced ext globbing
 */
export function pad(
  input: string,
  strLen: number,
  opts: FillOption = {
    char: " ",
    strict: false,
    side: "left",
    strictChar: "",
    strictSide: "right"
  }
): string {
  let out = input;
  const outL = out.length;
  if (outL < strLen) {
    if (opts.side === "left") {
      out = out.padStart(strLen, opts.char);
    } else {
      out = out.padEnd(strLen, opts.char);
    }
  } else if (opts.strict && outL > strLen) {
    let addChar = opts.strictChar ? opts.strictChar : "";
    if (opts.strictSide === "left") {
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
