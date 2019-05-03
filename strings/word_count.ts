// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

const cleanString = (input: string): string =>
  input.trim().replace(/\s+/g, " ");

/** Helper to count words in a given string */
export function wordCount(input: string): number {
  if (input.length == 0) return 0;

  const cleanedInput = cleanString(input);

  return cleanedInput.split(" ").length;
}
