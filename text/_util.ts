// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const ACRONYM_REGEXP = /\p{Lu}{2,}/u; // e.g. ID, URL
const CAPITALIZED_WORD_REGEXP = /\p{Lu}\p{Ll}+/u; // e.g. Apple
const LOWERCAASED_WORD_REGEXP = /\P{Lu}+/u; // e.g. apple, this will also match a sequence of unicode letters in languages without a concept of upper/lower case
const DIGITS_REGEXP = /\p{N}+/u; // e.g. 123
const MATCH_WORD_BASE_CASE_REGEXP = new RegExp(
  `${ACRONYM_REGEXP.source}|${CAPITALIZED_WORD_REGEXP.source}|${DIGITS_REGEXP.source}|${LOWERCAASED_WORD_REGEXP.source}`,
  "gu",
);

function splitByCase(input: string): string[] {
  const matches = input.match(MATCH_WORD_BASE_CASE_REGEXP);

  return matches || [input];
}

export function splitToWords(input: string) {
  return input.split(/[^\p{L}\p{N}]+/u).filter(Boolean).flatMap(splitByCase);
}

export function capitalizeWord(word: string): string {
  return word
    ? word?.[0]?.toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
    : word;
}
