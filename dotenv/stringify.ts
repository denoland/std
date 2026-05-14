// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Stringify an object into a valid `.env` file format.
 *
 * @example Usage
 * ```ts
 * import { stringify } from "@std/dotenv/stringify";
 * import { assertEquals } from "@std/assert";
 *
 * const object = { GREETING: "hello world" };
 * assertEquals(stringify(object), "GREETING='hello world'");
 * ```
 *
 * @param object object to be stringified
 * @returns string of object
 */
export function stringify(object: Record<string, string>): string {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(object)) {
    let quote: string | undefined;

    let escapedValue = value ?? "";
    if (key.startsWith("#")) {
      // deno-lint-ignore no-console
      console.warn(
        `key starts with a '#' indicates a comment and is ignored: '${key}'`,
      );
      continue;
    }

    const hasNewline = escapedValue.includes("\n");
    const hasSingleQuote = escapedValue.includes("'");
    const hasDoubleQuote = escapedValue.includes('"');

    // Use double quotes when the value contains newlines (so they can be
    // expanded back) or single quotes (which are safe inside double quotes).
    if (hasNewline || hasSingleQuote) {
      quote = `"`;
      // Escape backslashes first so that existing backslashes are not
      // confused with escape sequences when parsed.
      escapedValue = escapedValue.replaceAll("\\", "\\\\");
      if (hasNewline) escapedValue = escapedValue.replaceAll("\n", "\\n");
    } else if (hasDoubleQuote || escapedValue.match(/\W/)) {
      quote = "'";
    }

    if (quote) {
      // escape inner quotes
      escapedValue = escapedValue.replaceAll(quote, `\\${quote}`);
      escapedValue = `${quote}${escapedValue}${quote}`;
    }
    const line = `${key}=${escapedValue}`;
    lines.push(line);
  }
  return lines.join("\n");
}
