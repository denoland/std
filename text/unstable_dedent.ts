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

  const whitespaceOnlyLineRegex = new RegExp(
    WHITE_SPACE_ONLY_LINE_REGEXP,
    WHITE_SPACE_ONLY_LINE_REGEXP.flags + "g",
  );

  if (typeof input === "string") {
    const trimmedInput = input.replace(/^\n/, "").replace(/\n[\t ]*$/, "");
    if (!indent) return trimmedInput;
    const minIndentRegex = new RegExp(String.raw`^${indent}`, "gmu");
    return trimmedInput
      .replaceAll(minIndentRegex, "")
      .replaceAll(whitespaceOnlyLineRegex, "");
  }

  // #6830: previously the indent regex was applied to the fully substituted
  // input string, which also stripped leading whitespace from substitution
  // values whenever that whitespace happened to match the outer template's
  // computed indent. Apply indent stripping only to the literal template
  // parts so a multi-line substituted value keeps its own indentation
  // verbatim.
  const stripIndentAfterNewlineRegex = indent
    ? new RegExp(String.raw`\n${indent}`, "gu")
    : null;
  const stripIndentAtStartRegex = indent
    ? new RegExp(String.raw`^${indent}`, "u")
    : null;

  let assembled = "";
  for (let i = 0; i < input.raw.length; i++) {
    let part = input.raw[i] ?? "";
    if (stripIndentAfterNewlineRegex) {
      part = part.replaceAll(stripIndentAfterNewlineRegex, "\n");
    }
    // The very first literal char is at the start of the template (no
    // preceding newline), so leading-indent there is not caught by the
    // `\n${indent}` rule above.
    if (i === 0 && stripIndentAtStartRegex) {
      part = part.replace(stripIndentAtStartRegex, "");
    }
    assembled += part;
    if (i < values.length) {
      assembled += String(values[i]);
    }
  }

  const trimmedInput = assembled.replace(/^\n/, "").replace(/\n[\t ]*$/, "");
  if (!indent) return trimmedInput;
  return trimmedInput.replaceAll(whitespaceOnlyLineRegex, "");
}
