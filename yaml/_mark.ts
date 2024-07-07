// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const INDENT = 4;
const MAX_LENGTH = 75;
const DELIMITERS = "\x00\r\n\x85\u2028\u2029";

export class Mark {
  buffer: string;
  position: number;
  line: number;
  column: number;
  constructor(
    buffer: string,
    position: number,
    line: number,
    column: number,
  ) {
    this.buffer = buffer;
    this.position = position;
    this.line = line;
    this.column = column;
  }

  getSnippet(): string | null {
    if (!this.buffer) return null;
    let start = this.position;
    let end = this.position;
    let head = "";
    let tail = "";

    while (start > 0 && !DELIMITERS.includes(this.buffer.charAt(start - 1))) {
      start--;
      if (this.position - start > MAX_LENGTH / 2 - 1) {
        head = " ... ";
        start += 5;
        break;
      }
    }

    while (
      end < this.buffer.length && !DELIMITERS.includes(this.buffer.charAt(end))
    ) {
      end++;
      if (end - this.position > MAX_LENGTH / 2 - 1) {
        tail = " ... ";
        end -= 5;
        break;
      }
    }

    const snippet = this.buffer.slice(start, end);
    const indent = " ".repeat(INDENT);
    const caretIndent = " ".repeat(
      INDENT + this.position - start + head.length,
    );
    return `${indent + head + snippet + tail}\n${caretIndent}^`;
  }

  toString(): string {
    let where = `at line ${this.line + 1}, column ${this.column + 1}`;
    const snippet = this.getSnippet();
    if (snippet) where += `:\n${snippet}`;
    return where;
  }
}
