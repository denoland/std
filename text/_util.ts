// Copyright 2018-2026 the Deno authors. MIT license.

const CAPITALIZED_WORD_REGEXP = /\p{Lu}\p{Ll}+/u; // e.g. Apple
const ACRONYM_REGEXP = /\p{Lu}+(?=(\p{Lu}\p{Ll})|\P{L}|\b)/u; // e.g. ID, URL, handles an acronym followed by a capitalized word e.g. HTMLElement
const LOWERCASED_WORD_REGEXP = /(\p{Ll}+)/u; // e.g. apple
const ANY_LETTERS = /\p{L}+/u; // will match any sequence of letters, including in languages without a concept of upper/lower case
const DIGITS_REGEXP = /\p{N}+/u; // e.g. 123

const WORD_OR_NUMBER_REGEXP = new RegExp(
  `${CAPITALIZED_WORD_REGEXP.source}|${ACRONYM_REGEXP.source}|${LOWERCASED_WORD_REGEXP.source}|${ANY_LETTERS.source}|${DIGITS_REGEXP.source}`,
  "gu",
);

export function splitToWords(input: string) {
  return input.match(WORD_OR_NUMBER_REGEXP) ?? [];
}

export function capitalizeWord(word: string): string {
  return word ? word[0]!.toUpperCase() + word.slice(1).toLowerCase() : word;
}
