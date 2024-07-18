// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

const RE_ACRONYM = /\p{Lu}{2,}/gu; // e.g. ID, URL
const RE_CAPITALIZED_WORD = /\p{Lu}\p{Ll}+/gu; // e.g. Apple
const RE_LOWERCASED_WORD = /\P{Lu}+/gu; // e.g. apple, this will also match a sequence of unicode letters in languages without a concept of upper/lower case
const RE_DIGITS = /\p{N}+/gu; // e.g. 123
const RE_MATCH_WORD_BY_CASE = new RegExp(
  `${RE_ACRONYM.source}|${RE_CAPITALIZED_WORD.source}|${RE_DIGITS.source}|${RE_LOWERCASED_WORD.source}`,
  "gu",
);

function splitByCase(input: string): string[] {
  const matches = input.match(RE_MATCH_WORD_BY_CASE);

  return matches || [input];
}

export function splitToWords(input: string) {
  return input.split(/[^\p{L}\p{N}]+/gu).filter(Boolean).flatMap(splitByCase);
}

export function capitalizeWord(word: string): string {
  return word
    ? word?.[0]?.toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
    : word;
}
