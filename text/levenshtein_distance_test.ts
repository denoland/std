// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { levenshteinDistance } from "./levenshtein_distance.ts";

Deno.test("levenshteinDistanceAbove0", function () {
  assertEquals(
    levenshteinDistance("aa", "bb"),
    2,
  );
});

Deno.test("levenshteinDistance0", function () {
  assertEquals(
    levenshteinDistance("aa", "aa"),
    0,
  );
});
