// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
function splitByCase(input: string): string[] {
  const acronym = /\p{Lu}{2,}/gu; // e.g. ID, URL
  const capitalizedWord = /\p{Lu}\p{Ll}+/gu; // e.g. Apple
  const lowercasedWord = /\P{Lu}+/gu; // e.g. apple, this will also match a sequence of unicode letters in languages without a concept of upper/lower case
  const digits = /\p{N}+/gu; // e.g. 123

  const matchWordByCase = new RegExp(
    `${acronym.source}|${capitalizedWord.source}|${digits.source}|${lowercasedWord.source}`,
    "gu",
  );

  const matches = input.match(matchWordByCase);

  return matches || [input];
}

export function splitToWords(input: string) {
  const words = input.split(/[^\p{L}\p{N}]+/gu).filter(Boolean).flatMap(
    splitByCase,
  );
  return words;
}

export function capitalizeWord(word: string): string {
  return word
    ? word?.[0]?.toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
    : word;
}
