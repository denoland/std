// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { levenshteinDistance } from "./levenshtein_distance.ts";
import { assert } from "../assert/assert.ts";

// NOTE: this metric may change in future versions (e.g. better than levenshteinDistance)
const getWordDistance = levenshteinDistance;

/**
 * get most-similar word
 *
 * @example
 * ```ts
 * import { closest } from "https://deno.land/std@$STD_VERSION/text/word_similarity.ts";
 *
 * const possibleWords: string[] = [ "length", "size", "blah", "help", ]
 *
 * // case-insensitve by default
 * const word = closest("hep", possibleWords)
 * ```
 *
 * @param givenWord - The string to measure distance against
 * @param possibleWords - The string-array that will be sorted
 * @param [options.caseSensitive=false] - Flag indicating whether the distance should include case. Default is false.
 * @returns A sorted copy of possibleWords
 * @note
 * the ordering of words may change with verion-updates
 * e.g. word-distance metric may change (improve)
 * use a named-distance (e.g. levenshteinDistance) to
 * guarentee a particular ordering
 */
export function closest(
  givenWord: string,
  possibleWords: string[],
  options?: {
    caseSensitive?: boolean;
  },
): string {
  assert(
    possibleWords.length > 0,
    `When using closest(), the possibleWords array must contain at least one word`,
  );
  const { caseSensitive } = { ...options };

  if (!caseSensitive) {
    givenWord = givenWord.toLowerCase();
  }

  let nearestWord = possibleWords[0];
  let closestDistance = 0;
  for (const each of possibleWords) {
    const distance = caseSensitive
      ? getWordDistance(givenWord, each)
      : getWordDistance(givenWord, each.toLowerCase());
    if (distance < closestDistance) {
      nearestWord = each;
      closestDistance = distance;
    }
  }
  // this distance metric could be swapped/improved in the future
  return nearestWord;
}

/**
 * Sort based on word similarity
 *
 * @example
 * ```ts
 * import { similarityCompare } from "https://deno.land/std@$STD_VERSION/text/word_similarity.ts";
 * const words = [ "hi", "hello", "help" ]
 *
 * // words most-similar to "hep" will be at the front
 * words.sort(similarityCompare("hep"))
 * ```
 * @note
 * the ordering of words may change with verion-updates
 * e.g. word-distance metric may change (improve)
 * use a named-distance (e.g. levenshteinDistance) to
 * guarentee a particular ordering
 */
export function similarityCompare(
  givenWord: string,
  options?: { caseSensitive?: boolean },
) {
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

/**
 * Sorts a string-array by similarity to a given string
 *
 * @example
 * ```ts
 * import { wordSimilaritySort } from "https://deno.land/std@$STD_VERSION/text/word_similarity.ts";
 *
 * const possibleWords: string[] = [ "length", "size", "blah", "help", ]
 *
 * // case-insensitve by default
 * const suggestions = wordSimilaritySort("hep", possibleWords).join(", ")
 *
 * // force case sensitive
 * wordSimilaritySort("hep", possibleWords, { caseSensitive: true })
 * ```
 *
 * @param givenWord - The string to measure distance against
 * @param possibleWords - The string-array that will be sorted
 * @param options.caseSensitive - Flag indicating whether the distance should include case. Default is false.
 * @returns A sorted copy of possibleWords
 */
export function wordSimilaritySort(
  givenWord: string,
  possibleWords: string[],
  options?: {
    caseSensitive?: boolean;
  },
): string[] {
  const { caseSensitive } = { ...options };

  // this distance metric could be swapped/improved in the future
  return [...possibleWords].sort(
    similarityCompare(givenWord, { caseSensitive }),
  );
}
