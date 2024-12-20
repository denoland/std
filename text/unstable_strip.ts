// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { escape } from "@std/regexp";

export type StripOptions = {
  /**
   * If `true`, all occurrences will be stripped from the start of the string.
   * If a number, the specified number of occurrences will be stripped from the start.
   *
   * @default {true} // if `end` option is omitted
   * @default {false} // if `end` option is specified
   */
  start?: boolean | number;
  /**
   * If `true`, all occurrences will be stripped from the end of the string.
   * If a number, the specified number of occurrences will be stripped from the end.
   *
   * @default {true} // if `start` option is omitted
   * @default {false} // if `start` option is specified
   */
  end?: boolean | number;
};

/**
 * Strips the specified pattern from the start and/or end of the string.
 *
 * @param str The string to strip from.
 * @param pattern The pattern to strip from the string.
 * @param options An object containing options for the strip operation.
 *
 * @example Strip both start and end
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("---x---", "-"), "x");
 * ```
 *
 * @example Strip start only
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("---x---", "-", { start: true }), "x---");
 * ```
 *
 * @example Strip end only
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("---x---", "-", { end: true }), "---x");
 * ```
 *
 * @example Strip a given number of occurrences
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("---x---", "-", { start: 2, end: 1 }), "-x--");
 * ```
 *
 * @example Strip using a regexp
 * ```ts
 * import { strip } from "@std/text/unstable-strip";
 * import { assertEquals } from "@std/assert";
 * assertEquals(strip("-_-x-_-", /[-_]/), "x");
 * ```
 */
export function strip(
  str: string,
  pattern: string | RegExp,
  options?: StripOptions,
): string {
  const source = typeof pattern === "string" ? escape(pattern) : pattern.source;
  const flags = typeof pattern === "string" ? "" : getFlags(pattern);

  const start = options?.start ?? (options?.end == null ? true : false);
  const end = options?.end ?? (options?.start == null ? true : false);

  let prev = str;

  for (
    const [option, regex] of [
      [start, new RegExp(`^${source}`, flags)],
      [end, new RegExp(`${source}$`, flags)],
    ] as const
  ) {
    const count = typeof option === "number" ? option : option ? Infinity : 0;

    for (let i = 0; i < count; ++i) {
      str = str.replace(regex, "");
      if (str === prev) break;
      prev = str;
    }
  }

  return str;
}

function getFlags(re: RegExp): string {
  const flags = new Set(re.flags);
  flags.delete("g");
  flags.delete("y");

  return [...flags.keys()].join("");
}
