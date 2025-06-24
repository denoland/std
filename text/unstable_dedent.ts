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
  // Substitute nonempty placeholder so multiline substitutions do not affect indent width.
  const joinedTemplate = typeof input === "string" ? input : input.join("x");
  const ignoreFirstUnindented = !joinedTemplate.startsWith("\n");
  const trimmedTemplate = joinedTemplate.replace(/^\n/, "").trimEnd();
  const lines = trimmedTemplate.split("\n");

  let minIndentWidth: number | undefined = undefined;
  for (let i = 0; i < lines.length; i++) {
    const indentMatch = lines[i]!.match(/^([ \t]*)[^ \t]/);

    // Skip empty lines
    if (!indentMatch) {
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

  const inputString = typeof input === "string"
    ? input
    : String.raw({ raw: input }, ...values);
  const trimmedInput = inputString.replace(/^\n/, "").trimEnd();

  // No lines to indent
  if (minIndentWidth === undefined || minIndentWidth === 0) {
    return trimmedInput;
  }

  const minIndentRegex = new RegExp(
    String.raw`^[ \t]{${minIndentWidth}}`,
    "gm",
  );
  return trimmedInput
    .replaceAll(minIndentRegex, "")
    .replaceAll(/^[ \t]+$/gm, "");
}
