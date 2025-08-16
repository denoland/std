// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { escape } from "@std/regexp/escape";

/**
 * A pattern that can be used to trim characters from an input string.
 * - If `string`, trim all substrings equal to the string.
 * - If `Iterable<string>`, trim all substrings equal to any member.
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
 * @example Remove slashes from start and end of a path
 * ```ts
 * import { trimBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimBy("/path/to/file/", "/");
 * assertEquals(result, "path/to/file");
 * ```
 *
 * @example Remove leading and trailing line breaks
 * ```ts
 * import { trimBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimBy("\r\nHello, World!\r\n", ["\n", "\r"]);
 * assertEquals(result, "Hello, World!");
 * ```
 *
 * @example Strip non-word characters from start and end of a string
 * ```ts
 * import { trimBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimBy("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]/u);
 * assertEquals(result, "Seguro que no");
 * ```
 */
export function trimBy(
  str: string,
  pattern: TrimPattern,
): string {
  return trimStartBy(trimEndBy(str, pattern), pattern);
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
 * import { trimStartBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimStartBy("\ufeffhello world", "\ufeff");
 * assertEquals(result, "hello world");
 * ```
 *
 * @example Remove leading "http://" or "https://" from a URL
 * ```ts
 * import { trimStartBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimStartBy("https://example.com", ["http://", "https://"]);
 * assertEquals(result, "example.com");
 * ```
 *
 * @example Remove leading numbers from a string
 * ```ts
 * import { trimStartBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimStartBy("123abc456", /[0-9]+/);
 * assertEquals(result, "abc456");
 * ```
 */
export function trimStartBy(
  str: string,
  pattern: TrimPattern,
): string {
  return trimUntilDone(str, regExpFromTrimPattern`^${pattern}`);
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
 * @example Remove trailing period from a string
 * ```ts
 * import { trimEndBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimEndBy("Hello, World.", ".");
 * assertEquals(result, "Hello, World");
 * ```
 *
 * @example Remove trailing line endings
 * ```ts
 * import { trimEndBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimEndBy("file contents\n", ["\r", "\n"]);
 * assertEquals(result, "file contents");
 * ```
 *
 * @example Remove trailing whitespace characters
 * ```ts
 * import { trimEndBy } from "@std/text/unstable-trim-by";
 * import { assertEquals } from "@std/assert";
 *
 * const result = trimEndBy("  Hello, World!  ", /\s+/);
 * assertEquals(result, "  Hello, World!");
 * ```
 */
export function trimEndBy(
  str: string,
  pattern: TrimPattern,
): string {
  return trimUntilDone(str, regExpFromTrimPattern`${pattern}$`);
}

function trimUntilDone(str: string, regex: RegExp): string {
  let current = str;
  let next;
  while ((next = current.replace(regex, "")) !== current) current = next;
  return current;
}

function regExpFromTrimPattern(t: TemplateStringsArray, pattern: TrimPattern) {
  let { source, flags } = pattern instanceof RegExp ? pattern : {
    source: `${
      typeof pattern === "string" ? escape(pattern) : [...pattern]
        .sort((a, b) => b.length - a.length)
        .map(escape)
        .join("|")
    }`,
    flags: "",
  };

  source = `${t[0]!}(?:${source})${t[1]!}`;
  // remove any stateful flags to avoid `lastIndex` issues
  flags = flags.replace(/[gy]+/g, "");

  return new RegExp(source, flags);
}
