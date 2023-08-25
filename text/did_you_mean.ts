// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assert } from "../assert/assert.ts";
import { wordSimilaritySort } from "./_util.ts";

export class DidYouMeanError extends Error {
  override name = "DidYouMeanError";
  constructor(message: string) {
    super(message);
  }
}

/**
 * @example
 * ```ts
 * import { didYouMean } from "https://deno.land/std@$STD_VERSION/text/did_you_mean.ts";
 * const possibleWords: string[] = [ "length", "help", "Help", "size", "blah", ]
 *
 * didYouMean("help", possibleWords)
 * // ^ doesn't throw because "help" is valid
 *
 * didYouMean("HELP", possibleWords)
 * // ^ throws: DidYouMeanError(`For "HELP" did you mean one of ["help","Help","size","blah","length"]?`)
 *
 * didYouMean("hep", possibleWords, { suggestionLimit: 1 })
 * // ^ throws DidYouMeanError(`For "hep" did you mean "help"?`)
 *
 * didYouMean("HELP", possibleWords, { caseSensitiveDistance: true, suggestionLimit: 1 })
 * // ^ DidYouMeanError(`For "HELP" did you mean "Help"?`)
 * ```
 * @param {string} givenWord - The word to be checked for possible corrections.
 * @param {string[]} possibleWords - An array of possible words to compare against.
 * @param {boolean} [options.caseSensitiveDistance=false] - Flag indicating whether the spell check should be case sensitive. Default is false.
 * @param {number} [options.suggestionLimit=Infinity] - Number of suggestions to mention
 */
export function didYouMean(
  givenWord: string,
  possibleWords: string[],
  options?: {
    caseSensitiveDistance?: boolean;
    suggestionLimit?: number;
  },
): void {
  const { caseSensitiveDistance, suggestionLimit } = {
    caseSensitiveDistance: false,
    suggestionLimit: Infinity,
    ...options,
  };
  assert(
    possibleWords.length > 0,
    `Call to didYouMean() had empty array for possibleWords (there needs to be at least one possible word to perform a didYouMean)`,
  );
  if (!possibleWords.includes(givenWord)) {
    // try to be helpful when given an empty string
    if (givenWord.length == 0) {
      throw new DidYouMeanError(
        `An empty string was provided where one of the following strings was expected: ${
          JSON.stringify(possibleWords)
        }`,
      );
    }

    const suggestions: string[] = wordSimilaritySort(givenWord, possibleWords, {
      caseSensitive: caseSensitiveDistance,
    }).slice(0, suggestionLimit);
    if (suggestionLimit == 1) {
      throw new DidYouMeanError(
        `For ${JSON.stringify(givenWord)}, did you mean ${
          JSON.stringify(suggestions[0])
        }?`,
      );
    } else {
      throw new DidYouMeanError(
        `For ${JSON.stringify(givenWord)}, did you mean one of ${
          JSON.stringify(suggestions)
        }?`,
      );
    }
  }
}
