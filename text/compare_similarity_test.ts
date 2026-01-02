// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { compareSimilarity } from "./compare_similarity.ts";

Deno.test("compareSimilarity() handles basic example 1", function () {
  const words = ["hi", "hello", "help"];

  assertEquals(
    JSON.stringify(words.sort(compareSimilarity("hep"))),
    '["help","hi","hello"]',
  );
});

Deno.test("compareSimilarity() handles basic example 2", function () {
  const words = ["hi", "hello", "help", "HOWDY"];

  assertEquals(
    JSON.stringify(
      words.sort(compareSimilarity("HI", { caseSensitive: true })),
    ),
    '["hi","help","HOWDY","hello"]',
  );
});
