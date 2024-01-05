// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

export function split(input: string) {
  input = input.trim();
  if (input.includes(" ")) return input.split(/ +/).filter(Boolean);
  if (input.includes("-")) return input.split(/-+/).filter(Boolean);
  if (input.includes("_")) return input.split(/_+/).filter(Boolean);
  return input.split(/(?=[A-Z])+/).filter(Boolean);
}
export function capitalizeWord(word: string): string {
  return word ? word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase() : word;
}
