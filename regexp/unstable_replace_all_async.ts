// Copyright 2018-2026 the Deno authors. MIT license.
// deno-lint-ignore-file no-explicit-any

/**
 * Asynchronously replaces all occurrences of a pattern in a string.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param text - The original string.
 * @param searchValue - The regular expression pattern to search for.
 * @param replacer - An asynchronous function that returns the replacement string.
 * @returns A promise that resolves to the modified string.
 *
 * @example Usage
 * ```ts ignore
 * import { replaceAllAsync } from "@std/regexp/unstable-replace-all-async";
 * import { assertEquals } from "@std/assert";
 *
 * const result = await replaceAllAsync(
 *   "https://example.com/ and https://example.com/not-found!",
 *   /https:\/\/([\w\-/.]+)/g,
 *   async (match, address) => {
 *     const { status } = await fetch(match, { method: "HEAD" });
 *     return `${address} returned status ${status}`;
 *   },
 * );
 *
 * assertEquals(
 *   result,
 *   "example.com/ returned status 200 and example.com/not-found returned status 404!",
 * );
 * ```
 */
export async function replaceAllAsync(
  text: string,
  searchValue: RegExp | string,
  replacer: (substring: string, ...args: any[]) => Promise<string> | string,
): Promise<string> {
  const promises: (Promise<string> | string)[] = [];

  text.replaceAll(searchValue, (...args) => {
    promises.push(replacer(...args));
    return "";
  });

  const results = (await Promise.all(promises))[Symbol.iterator]();
  return text.replaceAll(searchValue, () => results.next().value!);
}
