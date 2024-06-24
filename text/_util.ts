// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

export function splitToWords(input: string) {
  input = input.replaceAll(/[^A-Za-zΑ-Ωα-ωА-Яа-яЁё0-9\s-_]/g, "");
  if (/[\s-_]+/.test(input)) return input.split(/[\s-_]+/);
  return input.split(/(?=[A-Z])+/);
}

export function capitalizeWord(word: string): string {
  return word
    ? word?.[0]?.toLocaleUpperCase() + word.slice(1).toLocaleLowerCase()
    : word;
}
