// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

/** EndOfLine character enum */
export enum EOL {
  LF = "\n",
  CRLF = "\r\n"
}

const regDetect = /(?:\r?\n)/g;
const regCRLF = /\r\n/g;
const regLF = /\n/g;

/**
 * Detect the EOL character for string input.
 * returns null if no newline
 */
export function detect(content: string): EOL | null {
  const d = content.match(regDetect);
  if (!d || d.length === 0) {
    return null;
  }
  const crlf = d.filter(x => x === EOL.CRLF);
  if (crlf.length > 0) {
    return EOL.CRLF;
  } else {
    return EOL.LF;
  }
}

/** Format the file to the targeted EOL */
export function format(content: string, eol: EOL): string {
  const _eol = detect(content);
  if (!_eol) {
    return content;
  } else if (_eol === eol) {
    return content;
  } else {
    if (_eol === EOL.CRLF) {
      return content.replace(regCRLF, eol);
    } else {
      return content.replace(regLF, eol);
    }
  }
}
