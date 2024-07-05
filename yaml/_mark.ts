// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const INDENT = 4;
const MAX_LENGTH = 75;

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

    let head = "";
    let start = this.position;

    while (
      start > 0 &&
      !"\x00\r\n\x85\u2028\u2029".includes(this.buffer.charAt(start - 1))
    ) {
      start -= 1;
      if (this.position - start > MAX_LENGTH / 2 - 1) {
        head = " ... ";
        start += 5;
        break;
      }
    }

    let tail = "";
    let end = this.position;

    while (
      end < this.buffer.length &&
      !"\x00\r\n\x85\u2028\u2029".includes(this.buffer.charAt(end))
    ) {
      end += 1;
      if (end - this.position > MAX_LENGTH / 2 - 1) {
        tail = " ... ";
        end -= 5;
        break;
      }
    }

    const snippet = this.buffer.slice(start, end);
    return `${" ".repeat(INDENT) + head + snippet + tail}\n${
      " ".repeat(INDENT + this.position - start + head.length)
    }^`;
  }

  toString(): string {
    const snippet = this.getSnippet();
    return `at line ${this.line + 1}, column ${this.column + 1}:\n${snippet}`;
  }
}
