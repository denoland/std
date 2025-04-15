// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import { Scanner, toml } from "./_parser.ts";

function createParseErrorMessage(scanner: Scanner, message: string) {
  const string = scanner.source.slice(0, scanner.position);
  const lines = string.split("\n");
  const row = lines.length;
  const column = lines.at(-1)?.length ?? 0;
  return `Parse error on line ${row}, column ${column}: ${message}`;
}

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
  try {
    const result = toml(scanner);
    if (result.ok && scanner.eof()) return result.body;
    const message = `Unexpected character: "${scanner.char()}"`;
    throw new SyntaxError(createParseErrorMessage(scanner, message));
  } catch (error) {
    if (error instanceof Error) {
      throw new SyntaxError(createParseErrorMessage(scanner, error.message));
    }
    const message = "Invalid error type caught";
    throw new SyntaxError(createParseErrorMessage(scanner, message));
  }
}
