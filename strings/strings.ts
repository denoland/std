/**
 * Return a number comparing two strings lexicographically.
 *
 * @example
 * ```ts
 * import { compare } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * compare("a", "b"); // -1
 * compare("a", "a"); // 0
 * compare("b", "a"); // 1
 * ```
 */

export function compare(a: string, b: string): number {
  if (a === b) {
    return 0;
  } else if (a < b) {
    return -1;
  } else {
    return 1;
  }
}

/**
 * Report whether a substring is within a string.
 *
 * @example
 * ```ts
 * import { contains } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * contains("Hello, Deno!", "Deno"); // true
 * ```
 */

export function contains(s: string, substr: string): boolean {
  return s.includes(substr);
}

/**
 * Count the number of non-overlapping instances of substr in str. Return 1 + the number
 * of Unicode points in str if substr is empty.
 *
 * @example
 * ```ts
 * import { count } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * count("cheese", "e"); // 3
 * count("five", ""); // 5
 * ```
 */

export function count(str: string, substr: string): number {
  if (substr === "") return str.length + 1;
  return str.split(substr).length - 1;
}

/**
 * Cut str into two parts with a sep. Return before, after, found. If sep is not present in str,
 * return str, "", false.
 *
 * @example
 * ```ts
 * import { cut } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * let [before, after, found] = cut("Deno", "n"); // "De", "o", true
 * let [before, after, found] = cut("Hello, World!", " "); // "Hello," "World!", true
 * let [before, after, found] = cut("Fresh", "i"); // "Fresh", "", false
 */

export function cut(str: string, sep: string): [string, string, boolean] {
  const s = str.split(sep);
  if (s.length == 2) return [s[0], s[1], true];
  return [str, "", false];
}

/**
 * Test wheter str begins with prefix.
 *
 * @example
 * ```ts
 * import { hasPrefix } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * hasPrefix("Deno", "De"); // true
 * hasPrefix("Deno", "C"); // false
 * hasPrefix("Deno", ""); // true
 * hasPrefix("Deno", "d"); //false
 * ```
 */

export function hasPrefix(str: string, prefix: string): boolean {
  if (str.length >= prefix.length && str.slice(0, prefix.length) === prefix) {
    return true;
  } else {
    return false;
  }
}

/**
 * Test wheter str ends with suffix.
 *
 * @example
 * ```ts
 * import { hasSuffix } from "https://deno.land/std@$STD_VERSION/strings/strings.ts";
 *
 * hasSuffix("Calvin", "in"); // true
 * hasSuffix("Calvin", "n"); // true
 * hasSuffix("Calvin", ""); // true
 * hasSuffix("Calvin", "Cal"); //false
 * ```
 */

export function hasSuffix(str: string, suffix: string): boolean {
  if (str.endsWith(suffix)) return true;
  return false;
}

/**
 * Returns s with all Unicode letters mapped to their lower case.
 *
 * @example
 * ```ts
 * import { toLower } from "https://deno.land/std@$STD_VERSION/strings/to_lower.ts";
 *
 * toLower("Hello, Deno!"); // hello, deno!
 * ```
 */
export function toLower(s: string): string {
  return s.toLowerCase();
}
