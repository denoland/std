// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { levenshteinDistance } from "./mod.ts";

Deno.test("levenshteinDistance() handles basic cases", function () {
  assertEquals(
    levenshteinDistance("aa", "bb"),
    2,
  );
});

Deno.test("levenshteinDistance() handles same strings", function () {
  assertEquals(
    levenshteinDistance("aa", "aa"),
    0,
  );
});
