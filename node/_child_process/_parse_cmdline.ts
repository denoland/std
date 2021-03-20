// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

export function parseCmdline(cmdline: string): string[] {
  cmdline = cmdline.trim();
  const parsed = [] as string[];
  let pos = 0;
  while (pos < cmdline.length) {
    parsed.push(next());
    skipWhitespaces();
  }
  return parsed;

  function skipWhitespaces(): void {
    while (pos < cmdline.length && /\s/.test(cmdline[pos])) {
      pos++;
    }
  }

  function next(): string {
    if (cmdline[pos] === '"') {
      return quoted();
    } else {
      return unquoted();
    }
  }

  function quoted(): string {
    pos++; // Skip quote
    const start = pos;
    while (pos < cmdline.length) {
      if (cmdline[pos] === '"') {
        const part = cmdline.slice(start, pos);
        pos++; // Skip quote
        return part;
      }
      pos++;
    }
    throw new Error("Unterminated quoted part");
  }

  function unquoted(): string {
    const start = pos;
    while (pos < cmdline.length) {
      pos++;
      if (/\s/.test(cmdline[pos])) {
        return cmdline.slice(start, pos);
      }
    }
    return cmdline.slice(start);
  }
}
