// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import {
  assertAlmostEquals,
  assertEquals,
  assertGreaterOrEqual,
  assertLessOrEqual,
} from "@std/assert";
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

Deno.test("levenshteinDistance() handles empty strings", () => {
  assertEquals(levenshteinDistance("aa", ""), 2);
  assertEquals(levenshteinDistance("", "aa"), 2);
});

Deno.test("levenshteinDistance() handles different-length strings", () => {
  assertEquals(levenshteinDistance("aab", "cc"), 3);
});

Deno.test("levenshteinDistance() handles shifted strings", () => {
  assertEquals(levenshteinDistance("rotation", "nrotatio"), 2);
});

Deno.test("levenshteinDistance() handles truncated strings", () => {
  assertEquals(levenshteinDistance("truncation", "runcatio"), 2);
});

Deno.test("levenshteinDistance() returns early on timeout with an approximate result", async (t) => {
  const maxTimeElapsed = 20;

  for (
    const [str1, str2] of [
      ["a".repeat(1e5), "b".repeat(1e5)],
      ["a".repeat(1e5), "b".repeat(2e5)],
      ["a".repeat(2e5), "b".repeat(1e5)],
      ["ab".repeat(1e5), "ba".repeat(1e5)],
    ] as const
  ) {
    await t.step(
      `${str1.slice(0, 4)}...${str1.length} / ${
        str2.slice(0, 4)
      }...${str2.length}`,
      () => {
        const startTime = Date.now();

        const result = levenshteinDistance(str1, str2, { maxTimeElapsed });

        const maxDistance = Math.max(str1.length, str2.length);

        assertGreaterOrEqual(result, 0);
        assertLessOrEqual(result, maxDistance);

        assertAlmostEquals(Date.now() - startTime, maxTimeElapsed, 100);
      },
    );
  }
});
