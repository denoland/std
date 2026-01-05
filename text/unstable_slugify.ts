// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

const wordSegmenter = new Intl.Segmenter("en-US", { granularity: "word" });

/** Options for {@linkcode slugify}. */
export type SlugifyOptions = {
  /**
   * The regular expression to use for stripping characters.
   * @default {typeof NON_WORD}
   */
  strip: RegExp;
  /**
   * The transliteration function to use for converting non-Latin text.
   * Called on each word in the input before joining them with dashes.
   * @default {undefined}
   */
  transliterate: ((word: string) => string) | undefined;
};

/**
 * A regular expression for stripping non-word characters from slugs.
 *
 * @example Usage
 * ```ts
 * import { NON_WORD, slugify } from "@std/text/unstable-slugify";
 * import { assertEquals } from "@std/assert";
 * assertEquals(slugify("déjà-vu", { strip: NON_WORD }), "déjà-vu");
 * assertEquals(slugify("Συστημάτων Γραφής", { strip: NON_WORD }), "συστημάτων-γραφής");
 * ```
 */
export const NON_WORD = /[^\p{L}\p{M}\p{N}\-]+/gu;
/**
 * A regular expression for stripping diacritics from slugs.
 *
 * @example Usage
 * ```ts
 * import { DIACRITICS, slugify } from "@std/text/unstable-slugify";
 * import { assertEquals } from "@std/assert";
 * assertEquals(slugify("déjà-vu", { strip: DIACRITICS }), "deja-vu");
 * assertEquals(slugify("Συστημάτων Γραφής", { strip: DIACRITICS }), "συστηματων-γραφης");
 * ```
 */
export const DIACRITICS = /[^\p{L}\p{N}\-]+/gu;
/**
 * A regular expression for stripping ASCII diacritics (but not other diacritics) from slugs.
 *
 * @example Usage
 * ```ts
 * import { ASCII_DIACRITICS, slugify } from "@std/text/unstable-slugify";
 * import { assertEquals } from "@std/assert";
 * assertEquals(slugify("déjà-vu", { strip: ASCII_DIACRITICS }), "deja-vu");
 * assertEquals(slugify("Συστημάτων Γραφής", { strip: ASCII_DIACRITICS }), "συστημάτων-γραφής");
 * ```
 */
export const ASCII_DIACRITICS = /(?<=[a-zA-Z])\p{M}+|[^\p{L}\p{M}\p{N}\-]+/gu;
/**
 * A regular expression for stripping non-ASCII characters from slugs.
 *
 * @example Usage
 * ```ts
 * import { NON_ASCII, slugify } from "@std/text/unstable-slugify";
 * import { assertEquals } from "@std/assert";
 * assertEquals(slugify("déjà-vu", { strip: NON_ASCII }), "deja-vu");
 * assertEquals(slugify("Συστημάτων Γραφής", { strip: NON_ASCII }), "-");
 * ```
 */
export const NON_ASCII = /[^0-9a-zA-Z\-]/g;

/**
 * Converts a string into a {@link https://en.wikipedia.org/wiki/Clean_URL#Slug | slug}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param input The string that is going to be converted into a slug
 * @param options The options for the slugify function
 * @returns The string as a slug
 *
 * @example Basic usage
 * ```ts
 * import { slugify } from "@std/text/unstable-slugify";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(slugify("Hello, world!"), "hello-world");
 * assertEquals(slugify("Συστημάτων Γραφής"), "συστημάτων-γραφής");
 * ```
 *
 * @example With transliteration using a third-party library
 * ```ts no-assert
 * import { NON_ASCII, slugify } from "@std/text/unstable-slugify";
 * // example third-party transliteration library
 * import transliterate from "npm:any-ascii";
 *
 * slugify("Συστημάτων Γραφής", { transliterate, strip: NON_ASCII });
 * // => "sistimaton-grafis"
 * ```
 */
export function slugify(
  input: string,
  options?: Partial<SlugifyOptions>,
): string {
  // clone with `new RegExp` in case `lastIndex` isn't zeroed
  const stripRe = new RegExp(options?.strip ?? NON_WORD);
  const words: string[] = [];

  for (
    const s of wordSegmenter.segment(
      input.trim().normalize("NFD").toLowerCase(),
    )
  ) {
    if (s.isWordLike) {
      words.push(s.segment);
    } else if (s.segment.length) {
      words.push("-");
    }
  }

  return words
    .map(options?.transliterate ?? ((x) => x))
    .join(options?.transliterate ? "-" : "")
    .replaceAll(stripRe, "")
    .normalize("NFC")
    .replaceAll(/-{2,}/g, "-")
    .replaceAll(/^-|-$/g, "") ||
    "-";
}
