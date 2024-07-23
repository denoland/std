// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertStrictEquals } from "@std/assert";
import { levenshteinDistance } from "./levenshtein_distance.ts";

Deno.test("levenshteinDistance() handles basic cases", () => {
  assertStrictEquals(levenshteinDistance("levenshtein", "levenshtein"), 0);
  assertStrictEquals(levenshteinDistance("sitting", "kitten"), 3);
  assertStrictEquals(levenshteinDistance("gumbo", "gambol"), 2);
  assertStrictEquals(levenshteinDistance("saturday", "sunday"), 3);
  assertStrictEquals(levenshteinDistance("aarrgh", "aargh"), 1);
  assertStrictEquals(levenshteinDistance("aargh", "aarrgh"), 1);
});

Deno.test("levenshteinDistance() handles empty strings", () => {
  assertStrictEquals(levenshteinDistance("", "a"), 1);
  assertStrictEquals(levenshteinDistance("a", ""), 1);
  assertStrictEquals(levenshteinDistance("", ""), 0);
});

Deno.test("levenshteinDistance() handles long strings", () => {
  assertStrictEquals(
    levenshteinDistance(
      "the quick brown fox jumps over the lazy dog",
      "the lazy dog is jumped over by the quick brown fox",
    ),
    30,
  );
});
