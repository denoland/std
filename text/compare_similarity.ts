// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { levenshteinDistance } from "./levenshtein_distance.ts";

// NOTE: this metric may change in future versions (e.g. better than levenshteinDistance)
const getWordDistance = levenshteinDistance;

/**
 * Sort based on word similarity.
 *
 * @param givenWord The string to measure distance against.
 * @param options An options bag containing a `caseSensitive` flag indicating
 * whether the distance should include case. Default is false.
 * @returns The difference in distance. This will be a negative number if `a`
 * is more similar to `givenWord` than `b`, a positive number if `b` is more
 * similar, or `0` if they are equally similar.
 *
 * @example Usage
 *
 * Most-similar words will be at the start of the array.
 *
 * ```ts
 * import { compareSimilarity } from "@std/text/compare-similarity";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const words = ["hi", "hello", "help"];
 * const sortedWords = words.sort(compareSimilarity("hep"));
 *
 * assertEquals(sortedWords, ["help", "hi", "hello"]);
 * ```
 * @note
 * the ordering of words may change with version-updates
 * e.g. word-distance metric may change (improve)
 * use a named-distance (e.g. levenshteinDistance) to
 * guarantee a particular ordering
 */
export function compareSimilarity(
  givenWord: string,
  options?: { caseSensitive?: boolean },
): (a: string, b: string) => number {
  const { caseSensitive } = { ...options };
  if (caseSensitive) {
    return (a: string, b: string) =>
      getWordDistance(givenWord, a) - getWordDistance(givenWord, b);
  }
  givenWord = givenWord.toLowerCase();
  return (a: string, b: string) =>
    getWordDistance(givenWord, a.toLowerCase()) -
    getWordDistance(givenWord, b.toLowerCase());
}
