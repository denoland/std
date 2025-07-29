// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { escape } from "@std/regexp/escape";

/**
 * A pattern that can be used to trim characters from an input string.
 * - If `string`, trim all characters in the pattern string.
 * - If `Iterable<string>`, trim all substrings equal to any item.
 * - If `RegExp`, trim all substrings that match the regex.
 */
export type TrimPattern =
  | string
  | Iterable<string>
  | RegExp;

/**
 * Trims all instances of the specified pattern at the start and end of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to trim
 * @returns The trimmed input string
 *
 * @example Strip non-word characters from start and end of a string
 * ```ts
 * import { trim } from "@std/text/unstable-trim";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trim("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u);
 * assertEquals(result, "Seguro que no");
 * ```
 */
export function trim(
  str: string,
  pattern: TrimPattern,
): string {
  return trimStart(trimEnd(str, pattern), pattern);
}

/**
 * Trims all instances of the specified pattern at the start of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to trim
 * @returns The trimmed input string
 *
 * @example Remove leading byte-order marks
 * ```ts
 * import { trimStart } from "@std/text/unstable-trim";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimStart("\ufeffhello world", "\ufeff");
 * assertEquals(result, "hello world");
 * ```
 */
export function trimStart(
  str: string,
  pattern: TrimPattern,
): string {
  return str.replace(regExpFromTrimPattern`^${pattern}`, "");
}

/**
 * Trims all instances of the specified pattern at the end of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to trim
 * @returns The trimmed input string
 *
 * @example Remove trailing line endings
 * ```ts
 * import { trimEnd } from "@std/text/unstable-trim";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimEnd("file contents\r\n\n", ["\n", "\r\n"]);
 * assertEquals(result, "file contents");
 * ```
 */
export function trimEnd(
  str: string,
  pattern: TrimPattern,
): string {
  return str.replace(regExpFromTrimPattern`${pattern}$`, "");
}

function regExpFromTrimPattern(t: TemplateStringsArray, pattern: TrimPattern) {
  let { source, flags } = pattern instanceof RegExp ? pattern : {
    source: `${
      [...new Set(pattern)]
        .sort((a, b) => b.length - a.length)
        .map(escape)
        .join("|")
    }`,
    flags: "",
  };

  source = `${t[0]!}(?:${source})+${t[1]!}`;
  flags = flags.replace(/[gy]+/g, "");

  return new RegExp(source, flags);
}
