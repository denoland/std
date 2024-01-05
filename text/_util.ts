// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

export interface SplitOptions {
  singleDelimiter?: boolean;
  removeSpecialCharacters?: boolean;
}

export function split(
  input: string,
  { singleDelimiter = false, removeSpecialCharacters }: SplitOptions = {},
) {
  if (removeSpecialCharacters) {
    input = input.replaceAll(/[^a-zA-Z0-9\s-_]/g, "");
  }
  if (singleDelimiter) {
    if (/\s+/.test(input)) return input.split(/\s+/).filter(Boolean);
    if (/-+/.test(input)) return input.split(/-+/).filter(Boolean);
    if (/_+/.test(input)) return input.split(/_+/).filter(Boolean);
  } else {
    if (/[\s-_]+/.test(input)) return input.split(/[\s-_]+/).filter(Boolean);
  }
  return input.split(/(?=[A-Z])+/).filter(Boolean);
}

export function capitalizeWord(word: string): string {
  return word
    ? word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
    : word;
}
