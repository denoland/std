// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { levenshteinDistance } from "./levenshtein_distance.ts";

// Note: this metric may change in future versions (e.g. better than levenshteinDistance)
const getWordDistance = levenshteinDistance;

/** Options for {@linkcode compareSimilarity}. */
export interface CompareSimilarityOptions {
  /**
   * Whether the distance should include case.
   *
   * @default {false}
   */
  caseSensitive?: boolean;
}

/**
 * Takes a string and generates a comparator function to determine which of two
 * strings is more similar to the given one.
 *
 * Note: the ordering of words may change with version-updates
 * E.g. word-distance metric may change (improve)
 * use a named-distance (e.g. levenshteinDistance) to
 * guarantee a particular ordering.
 *
 * @param givenWord The string to measure distance against.
 * @param options Options for the sort.
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
 * import { assertEquals } from "@std/assert";
 *
 * const words = ["hi", "hello", "help"];
 * const sortedWords = words.toSorted(compareSimilarity("hep"));
 *
 * assertEquals(sortedWords, ["help", "hi", "hello"]);
 * ```
 */
export function compareSimilarity(
  givenWord: string,
  options?: CompareSimilarityOptions,
): (a: string, b: string) => number {
  if (options?.caseSensitive) {
    return (a: string, b: string) =>
      getWordDistance(givenWord, a) - getWordDistance(givenWord, b);
  }
  givenWord = givenWord.toLowerCase();
  return (a: string, b: string) =>
    getWordDistance(givenWord, a.toLowerCase()) -
    getWordDistance(givenWord, b.toLowerCase());
}
