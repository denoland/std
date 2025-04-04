// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { escape } from "@std/regexp/escape";

/**
 * A string or function that can be used as the second parameter of
 * `String.prototype.replace()`.
 */
export type Replacer =
  | string
  | ((substring: string, ...args: unknown[]) => string);

/**
 * Replaces the specified pattern at the start and end of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to replace
 * @param replacer String or function to be used as the replacement
 *
 * @example Strip non-word characters from start and end of a string
 * ```ts
 * import { replaceBoth } from "@std/text/unstable-replace";
 * import { assertEquals } from "@std/assert";
 *
 * const result = replaceBoth("¡¿Seguro que no?!", /[^\p{L}\p{M}\p{N}]+/u, "");
 * assertEquals(result, "Seguro que no");
 * ```
 */
export function replaceBoth(
  str: string,
  pattern: string | RegExp,
  replacer: Replacer,
): string {
  return replaceStart(
    replaceEnd(str, pattern, replacer),
    pattern,
    replacer,
  );
}

/**
 * Replaces the specified pattern at the start of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to replace
 * @param replacer String or function to be used as the replacement
 *
 * @example Strip byte-order mark
 * ```ts
 * import { replaceStart } from "@std/text/unstable-replace";
 * import { assertEquals } from "@std/assert";
 *
 * const result = replaceStart("\ufeffhello world", "\ufeff", "");
 * assertEquals(result, "hello world");
 * ```
 *
 * @example Replace `http:` protocol with `https:`
 * ```ts
 * import { replaceStart } from "@std/text/unstable-replace";
 * import { assertEquals } from "@std/assert";
 *
 * const result = replaceStart("http://example.com", "http:", "https:");
 * assertEquals(result, "https://example.com");
 * ```
 */
export function replaceStart(
  str: string,
  pattern: string | RegExp,
  replacer: Replacer,
): string {
  return str.replace(
    cloneAsStatelessRegExp`^${pattern}`,
    replacer as string,
  );
}

/**
 * Replaces the specified pattern at the start of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to replace
 * @param replacer String or function to be used as the replacement
 *
 * @example Remove a single trailing newline
 * ```ts
 * import { replaceEnd } from "@std/text/unstable-replace";
 * import { assertEquals } from "@std/assert";
 *
 * const result = replaceEnd("file contents\n", "\n", "");
 * assertEquals(result, "file contents");
 * ```
 *
 * @example Ensure pathname ends with a single slash
 * ```ts
 * import { replaceEnd } from "@std/text/unstable-replace";
 * import { assertEquals } from "@std/assert";
 *
 * const result = replaceEnd("/pathname", new RegExp("/*"), "/");
 * assertEquals(result, "/pathname/");
 * ```
 */
export function replaceEnd(
  str: string,
  pattern: string | RegExp,
  replacement: Replacer,
): string {
  return str.replace(
    cloneAsStatelessRegExp`${pattern}$`,
    replacement as string,
  );
}

function cloneAsStatelessRegExp(
  { raw: [$0, $1] }: TemplateStringsArray,
  pattern: string | RegExp,
) {
  const { source, flags } = typeof pattern === "string"
    ? { source: escape(pattern), flags: "" }
    : pattern;

  return new RegExp(`${$0!}(?:${source})${$1!}`, flags.replace(/[gy]+/g, ""));
}
