// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert/equals";
import { levenshteinDistance } from "./levenshtein_distance.ts";

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
  await t.step("`myers32` fast path", () => {
    assertEquals(levenshteinDistance("💩", "x"), 1);
    assertEquals(levenshteinDistance("💩", ""), 1);
    assertEquals(levenshteinDistance("x", "💩"), 1);
    assertEquals(levenshteinDistance("", "💩"), 1);
    // first surrogate same
    assertEquals(levenshteinDistance("💩", "💫"), 1);
    // both surrogates different
    assertEquals(levenshteinDistance("💩", "🦄"), 1);
    // max cp
    assertEquals(levenshteinDistance("\u{10FFFE}", "\u{10FFFF}"), 1);
  });

  await t.step("`myersX` path", () => {
    assertEquals(levenshteinDistance("💩".repeat(33), "x".repeat(33)), 33);
    assertEquals(levenshteinDistance("💩".repeat(33), ""), 33);
    assertEquals(levenshteinDistance("x".repeat(33), "💩".repeat(33)), 33);
    assertEquals(levenshteinDistance("", "💩".repeat(33)), 33);
    // first surrogate same
    assertEquals(levenshteinDistance("💩".repeat(33), "💫".repeat(33)), 33);
    // both surrogates different
    assertEquals(levenshteinDistance("💩".repeat(33), "🦄".repeat(33)), 33);
    // max cp
    assertEquals(
      levenshteinDistance("\u{10FFFE}".repeat(33), "\u{10FFFF}".repeat(33)),
      33,
    );
  });
});
