// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { Scanner, toml } from "./_parser.ts";

/**
 * Parses a {@link https://toml.io | TOML} string into an object.
 *
 * @example Usage
 * ```ts
 * import { parse } from "@std/toml/parse";
 * import { assertEquals } from "@std/assert";
 *
 * const tomlString = `title = "TOML Example"
 * [owner]
 * name = "Alice"
 * bio = "Alice is a programmer."`;
 *
 * const obj = parse(tomlString);
 * assertEquals(obj, { title: "TOML Example", owner: { name: "Alice", bio: "Alice is a programmer." } });
 * ```
 * @param tomlString TOML string to be parsed.
 * @returns The parsed JS object.
 */
export function parse(tomlString: string): Record<string, unknown> {
  const scanner = new Scanner(tomlString);

  let parsed = null;
  let err: Error | null = null;
  try {
    parsed = toml(scanner);
  } catch (e) {
    err = e instanceof Error ? e : new Error("Invalid error type caught");
  }

  if (err || !parsed || !parsed.ok || !scanner.eof()) {
    const position = scanner.position();
    const subStr = tomlString.slice(0, position);
    const lines = subStr.split("\n");
    const row = lines.length;
    const column = (() => {
      let count = subStr.length;
      for (const line of lines) {
        if (count <= line.length) break;
        count -= line.length + 1;
      }
      return count;
    })();
    const message = `Parse error on line ${row}, column ${column}: ${
      err ? err.message : `Unexpected character: "${scanner.char()}"`
    }`;
    throw new SyntaxError(message);
  }
  return parsed.body;
}
