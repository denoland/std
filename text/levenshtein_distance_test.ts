// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert/equals";
import { levenshteinDistance } from "./levenshtein_distance.ts";

function assertLevenshteinBidi(a: string, b: string, distance: number) {
  assertEquals(levenshteinDistance(a, b), distance);
  assertEquals(levenshteinDistance(b, a), distance);
}

Deno.test("levenshteinDistance() handles basic cases", () => {
  assertEquals(levenshteinDistance("levenshtein", "levenshtein"), 0);
  assertEquals(levenshteinDistance("sitting", "kitten"), 3);
  assertEquals(levenshteinDistance("gumbo", "gambol"), 2);
  assertEquals(levenshteinDistance("saturday", "sunday"), 3);
  assertEquals(levenshteinDistance("aarrgh", "aargh"), 1);
  assertEquals(levenshteinDistance("aargh", "aarrgh"), 1);
});

Deno.test("levenshteinDistance() handles empty strings", () => {
  assertEquals(levenshteinDistance("", "a"), 1);
  assertEquals(levenshteinDistance("a", ""), 1);
  assertEquals(levenshteinDistance("", ""), 0);
});

Deno.test("levenshteinDistance() handles long strings", () => {
  assertEquals(
    levenshteinDistance(
      "the quick brown fox jumps over the lazy dog",
      "the lazy dog is jumped over by the quick brown fox",
    ),
    30,
  );
});

Deno.test("levenshteinDistance() handles code points above U+FFFF", async (t) => {
  await t.step("one of inputs is empty fast path", () => {
    assertLevenshteinBidi("💩", "", 1);
    assertLevenshteinBidi("\u{10FFFF}", "", 1);
  });

  await t.step("`myers32` fast path", () => {
    assertLevenshteinBidi("💩", "x", 1);
    // first surrogate same
    assertLevenshteinBidi("💩", "💫", 1);
    // both surrogates different
    assertLevenshteinBidi("💩", "🦄", 1);
    // max cp
    assertLevenshteinBidi("\u{10FFFF}x", "y", 2);
    assertLevenshteinBidi("x\u{10FFFF}", "y", 2);
    assertLevenshteinBidi("\u{10FFFE}", "\u{10FFFF}", 1);
    assertLevenshteinBidi("\u{10FFFF}", "\u{10FFFF}", 0);
  });

  await t.step("`myersX` path", () => {
    const MYERS_32_MAX = 32;
    const n = MYERS_32_MAX + 1;
    assertLevenshteinBidi("💩".repeat(n), "x".repeat(n), n);
    // first surrogate same
    assertLevenshteinBidi("💩".repeat(n), "💫".repeat(n), n);
    // both surrogates different
    assertLevenshteinBidi("💩".repeat(n), "🦄".repeat(n), n);
    // max cp
    assertLevenshteinBidi("\u{10FFFE}".repeat(n), "\u{10FFFF}".repeat(n), n);
    assertLevenshteinBidi("\u{10FFFE}".repeat(n), "\u{10FFFF}", n);
  });
});
