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
