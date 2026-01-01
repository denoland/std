// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertMatch } from "@std/assert";
import {
  ASCII_DIACRITICS,
  DIACRITICS,
  NON_ASCII,
  NON_WORD,
  slugify,
} from "./unstable_slugify.ts";

Deno.test("slugify() returns kebabcase", () => {
  assertEquals(slugify("hello world"), "hello-world");
});
Deno.test("slugify() returns lowercase", () => {
  assertEquals(slugify("Hello World"), "hello-world");
});

Deno.test("slugify() handles whitespaces", () => {
  assertEquals(slugify("  Hello   World  "), "hello-world");
  assertEquals(slugify("Hello\tWorld"), "hello-world");
  assertEquals(slugify("Hello\nWorld"), "hello-world");
  assertEquals(slugify("Hello\r\nWorld"), "hello-world");
});

Deno.test("slugify() normalizes diacritic characters to NFC form by default", () => {
  assertEquals(slugify("déjà vu".normalize("NFD")), "déjà-vu".normalize("NFC"));
  assertEquals(slugify("Cliché".normalize("NFD")), "cliché".normalize("NFC"));
  assertEquals(slugify("façade".normalize("NFD")), "façade".normalize("NFC"));
  assertEquals(slugify("résumé".normalize("NFD")), "résumé".normalize("NFC"));
  assertEquals(
    slugify("Συστημάτων Γραφής".normalize("NFD")),
    "συστημάτων-γραφής".normalize("NFC"),
  );
});

Deno.test("slugify() strips all non-ASCII chars, including diacritics, if strip: NON_ASCII", () => {
  assertEquals(
    slugify("déjà vu".normalize("NFC"), { strip: NON_ASCII }),
    "deja-vu",
  );
  assertEquals(
    slugify("déjà vu".normalize("NFD"), { strip: NON_ASCII }),
    "deja-vu",
  );
  assertEquals(slugify("Συστημάτων Γραφής", { strip: NON_ASCII }), "-");
});

Deno.test("slugify() strips all diacritics if strip: DIACRITICS", () => {
  assertEquals(
    slugify("déjà vu".normalize("NFC"), { strip: DIACRITICS }),
    "deja-vu",
  );
  assertEquals(
    slugify("déjà vu".normalize("NFD"), { strip: DIACRITICS }),
    "deja-vu",
  );
  assertEquals(
    slugify("Συστημάτων Γραφής", { strip: DIACRITICS }),
    "συστηματων-γραφης",
  );
});

Deno.test("slugify() strips ASCII diacritics (but not other diacritics) if strip: ASCII_DIACRITICS", () => {
  assertEquals(
    slugify("déjà-vu".normalize("NFC"), { strip: ASCII_DIACRITICS }),
    "deja-vu",
  );
  assertEquals(
    slugify("déjà-vu".normalize("NFD"), { strip: ASCII_DIACRITICS }),
    "deja-vu",
  );
  assertEquals(
    slugify("Συστημάτων Γραφής", { strip: ASCII_DIACRITICS }),
    "συστημάτων-γραφής",
  );
});

Deno.test("slugify() handles dashes", () => {
  assertEquals(slugify("-Hello-World-"), "hello-world");
  assertEquals(slugify("--Hello--World--"), "hello-world");
});

Deno.test("slugify() converts empty string to a single dash", () => {
  // Prevent any issues with zero-length slugs in URLs, e.g.
  // `/a//b` -> `/a/b`; `/a/` -> `/a`
  assertEquals(slugify(""), "-");
  assertEquals(slugify("abc", { strip: /./g }), "-");
});

Deno.test("slugify() replaces non-word characters with dashes", () => {
  assertEquals(slugify("Hello, world!"), "hello-world");
  assertEquals(slugify("hello ~ world"), "hello-world");

  assertEquals(
    slugify("Elon Musk considers move to Mars"),
    "elon-musk-considers-move-to-mars",
  );
  assertEquals(
    slugify("Fintech startups raised $34B in 2019"),
    "fintech-startups-raised-34b-in-2019",
  );
  assertEquals(
    slugify("Shopify joins Facebook’s cryptocurrency Libra Association"),
    "shopify-joins-facebooks-cryptocurrency-libra-association",
  );
  assertEquals(
    slugify("What is a slug and how to optimize it?"),
    "what-is-a-slug-and-how-to-optimize-it",
  );
  assertEquals(
    slugify("Bitcoin soars past $33,000, its highest ever"),
    "bitcoin-soars-past-33000-its-highest-ever",
  );
});

Deno.test("slugify() works with non-Latin alphabetic text", () => {
  assertEquals(slugify("Συστημάτων Γραφής"), "συστημάτων-γραφής");
  assertEquals(slugify("三人行，必有我师"), "三人行-必有我师");
});

Deno.test("slugify() deletes non-matches when a custom strip regex is supplied", () => {
  assertEquals(slugify("abcdef", { strip: /[ace]/g }), "bdf");
});

Deno.test("slugify() strips apostrophes within words", () => {
  // curly apostrophe
  assertEquals(slugify("What’s up?"), "whats-up");
  // straight apostrophe
  assertEquals(slugify("What's up?"), "whats-up");
});

Deno.test("slugify() strips or replaces all non-alphanumeric ASCII chars except for `-`", () => {
  /**
   * Ensure that interpolation into all parts of a URL (path segment, search
   * params, hash, subdomain, etc.) is safe, i.e. doesn't allow path traversal
   * or other exploits, which could be allowed by presence of chars like
   * `./?&=#` etc.
   */
  const ASCII_ALPHANUM_OR_DASH_ONLY = /^[a-zA-Z0-9\-]+$/;
  const ALL_ASCII = Array.from(
    { length: 0x80 },
    (_, i) => String.fromCodePoint(i),
  ).join("");

  // with default
  assertMatch(slugify(ALL_ASCII), ASCII_ALPHANUM_OR_DASH_ONLY);
  // even if we explicitly set the strip regex to match nothing
  assertMatch(
    slugify(ALL_ASCII, { strip: /[^\s\S]/gu }),
    ASCII_ALPHANUM_OR_DASH_ONLY,
  );

  // defense-in-depth - the exported regexes _also_ all strip non-ASCII characters
  for (const re of [ASCII_DIACRITICS, DIACRITICS, NON_ASCII, NON_WORD]) {
    assertMatch(ALL_ASCII.replaceAll(re, ""), ASCII_ALPHANUM_OR_DASH_ONLY);
  }
});

Deno.test("slugify() `transliterate` option works alongside third-party transliteration libs", () => {
  /**
   * We just use a simple mock transliteration function to test basic
   * compatibility here. For actual transliteration libraries,
   * [npm:any-ascii](https://github.com/anyascii/anyascii) seems to be a good
   * general-purpose option.
   */
  const transliterate = (s: string) => [...s].map((c) => map[c]).join("");

  const map: Record<string, string> = { 矿: "kuang", 泉: "quan", 水: "shui" };
  const input = "矿泉水";
  const expected = "kuangquan-shui";

  assertEquals(slugify(input, { transliterate }), expected);
});
