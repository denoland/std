// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Converts a string into a {@link https://en.wikipedia.org/wiki/Clean_URL#Slug | slug}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { slugify } from "@std/text/slugify";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(slugify("Hello, world!"), "hello-world");
 * assertEquals(slugify("Συστημάτων Γραφής"), "συστημάτων-γραφής");
 * ```
 *
 * @param input The string that is going to be converted into a slug
 * @returns The string as a slug
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize()
    // straight quotes + initial/final punctuation (curly quotes etc.)
    .replaceAll(/['"\p{Pi}\p{Pf}]/gu, "")
    // all other non-word chars (whitespace, commas, periods, symbols, etc.)
    .replaceAll(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replaceAll(/^-|-$/g, "");
}
