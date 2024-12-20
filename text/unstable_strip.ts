// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { escape } from "@std/regexp";

export type StripOptions = {
  /**
   * The number of occurrences to strip.
   * @default {Infinity}
   */
  count?: number;
};

/**
 * Strips the specified pattern from the start and end of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to strip from the input
 * @param options Options for the strip operation
 *
 * @example Strip using a string
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("---x---", "-"), "x");
 * ```
 *
 * @example Strip using a regexp
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("-_-x-_-", /[-_]/), "x");
 * ```
 *
 * @example Strip a specified count
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("---x---", "-", { count: 1 }), "--x--");
 * ```
 */
export function strip(
  str: string,
  pattern: string | RegExp,
  options?: StripOptions,
): string {
  const { source, flags } = cloneAsStatelessRegExp(pattern);
  return stripByRegExp(
    stripByRegExp(str, new RegExp(`^${source}`, flags), options),
    new RegExp(`${source}$`, flags),
    options,
  );
}

/**
 * Strips the specified pattern from the start of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to strip from the input
 * @param options Options for the strip operation
 *
 * @example Strip using a string
 * ```ts
 * import { stripStart } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(stripStart("---x---", "-"), "x---");
 * ```
 *
 * @example Strip using a regexp
 * ```ts
 * import { stripStart } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(stripStart("-_-x-_-", /[-_]/), "x-_-");
 * ```
 *
 * @example Strip a specified count
 * ```ts
 * import { stripStart } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(stripStart("---x---", "-", { count: 1 }), "--x---");
 * ```
 */
export function stripStart(
  str: string,
  pattern: string | RegExp,
  options?: StripOptions,
): string {
  const { source, flags } = cloneAsStatelessRegExp(pattern);
  return stripByRegExp(str, new RegExp(`^${source}`, flags), options);
}

/**
/**
 * Strips the specified pattern from the start of the string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param str The input string
 * @param pattern The pattern to strip from the input
 * @param options Options for the strip operation
 *
 * @example Strip using a string
 * ```ts
 * import { stripEnd } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(stripEnd("---x---", "-"), "---x");
 * ```
 *
 * @example Strip using a regexp
 * ```ts
 * import { stripEnd } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(stripEnd("-_-x-_-", /[-_]/), "-_-x");
 * ```
 *
 * @example Strip a specified count
 * ```ts
 * import { stripEnd } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(stripEnd("---x---", "-", { count: 1 }), "---x--");
 * ```
 */
export function stripEnd(
  str: string,
  pattern: string | RegExp,
  options?: StripOptions,
): string {
  const { source, flags } = cloneAsStatelessRegExp(pattern);
  return stripByRegExp(str, new RegExp(`${source}$`, flags), options);
}

function stripByRegExp(
  str: string,
  regExp: RegExp,
  options?: StripOptions,
): string {
  let prev = str;

  const count = options?.count ?? Infinity;

  for (let i = 0; i < count; ++i) {
    str = str.replace(regExp, "");
    if (str === prev) break;
    prev = str;
  }

  return str;
}

function cloneAsStatelessRegExp(pattern: string | RegExp) {
  return {
    source: typeof pattern === "string" ? escape(pattern) : pattern.source,
    flags: typeof pattern === "string" ? "" : getStatelessFlags(pattern),
  };
}

function getStatelessFlags(re: RegExp): string {
  return re.flags.replaceAll(/[gy]/g, "");
}
