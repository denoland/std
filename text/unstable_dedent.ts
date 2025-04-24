// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Removes indentation from multiline strings.
 *
 * - Removes leading newline
 * - Removes trailing whitespace, including newlines
 * - Replaces whitespace-only lines with empty lines
 * - Finds the minimum indentation among remaining lines and removes that much indentation from all of them
 *
 * @param input The string to remove indentation from.
 * @returns The string without indentation.
 *
 * @example Usage
 * ```ts
 * import { dedent } from "@std/text/unstable-dedent";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   dedent(`
 *     {
 *       msg: "Hello",
 *     }
 *   `),
 *   `{\n  msg: "Hello",\n}`
 * );
 * ```
 */
export function dedent(input: string): string;

/**
 * Removes indentation from multiline strings.
 *
 * - Removes leading newline
 * - Removes trailing whitespace, including newlines
 * - Replaces whitespace-only lines with empty lines
 * - Finds the minimum indentation among remaining lines and removes that much indentation from all of them
 *
 * @param input The template to remove indentation from.
 * @param values The template substitution values.
 * @returns The string without indentation.
 *
 * @example Usage
 * ```ts
 * import { dedent } from "@std/text/unstable-dedent";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   dedent`line 1
 *          line 2`,
 *   "line 1\nline 2"
 * );
 * ```
 */
export function dedent(
  input: TemplateStringsArray,
  ...values: unknown[]
): string;

export function dedent(
  input: TemplateStringsArray | string,
  ...values: unknown[]
): string {
  const inputString = typeof input === "string"
    ? input
    : String.raw({ raw: input }, ...values);
  const ignoreFirstUnindented = !inputString.startsWith("\n");
  const trimmedInput = inputString.replace(/^\n/, "").trimEnd();
  const lines = trimmedInput.split("\n");

  let minIndentWidth: number | undefined = undefined;
  for (let i = 0; i < lines.length; i++) {
    const indentMatch = lines[i]!.match(/^(\s*)\S/);

    // Skip empty lines
    if (indentMatch === null) {
      continue;
    }

    const indentWidth = indentMatch[1]!.length;
    if (ignoreFirstUnindented && i === 0 && indentWidth === 0) {
      continue;
    }
    if (minIndentWidth === undefined || indentWidth < minIndentWidth) {
      minIndentWidth = indentWidth;
    }
  }

  // No lines to indent
  if (minIndentWidth === undefined || minIndentWidth === 0) {
    return trimmedInput;
  }

  const minIndentRegex = new RegExp(`^\\s{${minIndentWidth}}`, "gm");
  return trimmedInput
    .replaceAll(minIndentRegex, "")
    .replaceAll(/^\s+$/gm, "");
}
