// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.
import { longestCommonPrefix } from "./unstable_longest_common_prefix.ts";

const WHITE_SPACE = String.raw`\t\v\f\ufeff\p{Space_Separator}`;
const INDENT_REGEXP = new RegExp(
  String.raw`^[${WHITE_SPACE}]+`,
  "u",
);
const WHITE_SPACE_ONLY_LINE_REGEXP = new RegExp(
  String.raw`^[${WHITE_SPACE}]+$`,
  "mu",
);

/**
 * Removes indentation from multiline strings.
 *
 * - Removes leading newline
 * - Removes a single trailing newline (with any preceding whitespace on that line)
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
 * - Removes a single trailing newline (with any preceding whitespace on that line)
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
  const trimmedTemplate = joinedTemplate.replace(/^\n/, "").replace(
    /\n[\t ]*$/,
    "",
  );
  const lines = trimmedTemplate.split("\n");

  const linesToCheck = lines.slice(
    ignoreFirstUnindented && !INDENT_REGEXP.test(lines[0] ?? "") ? 1 : 0,
  )
    .filter((l) => l.length > 0 && !WHITE_SPACE_ONLY_LINE_REGEXP.test(l));

  const commonPrefix = longestCommonPrefix(linesToCheck);
  const indent = commonPrefix.match(INDENT_REGEXP)?.[0];

  const inputString = typeof input === "string"
    ? input
    : String.raw({ raw: input }, ...values);
  const trimmedInput = inputString.replace(/^\n/, "").replace(/\n[\t ]*$/, "");

  // No lines to indent
  if (!indent) return trimmedInput;

  const minIndentRegex = new RegExp(String.raw`^${indent}`, "gmu");
  return trimmedInput
    .replaceAll(minIndentRegex, "")
    .replaceAll(
      new RegExp(
        WHITE_SPACE_ONLY_LINE_REGEXP,
        WHITE_SPACE_ONLY_LINE_REGEXP.flags + "g",
      ),
      "",
    );
}
