// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "@std/assert";
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
