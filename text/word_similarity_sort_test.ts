// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { wordSimilaritySort } from "./word_similarity_sort.ts";

Deno.test("wordSimilaritySort() checks basic example", function () {
  const possibleWords: string[] = ["length", "size", "blah", "help"];
  const badArg = "hep";
  assertEquals(
    wordSimilaritySort(badArg, possibleWords).join(", "),
    "help, size, blah, length",
  );
});

Deno.test("wordSimilaritySort() checks empty string", function () {
  const possibleWords: string[] = ["length", "size", "blah", "help", ""];
  const badArg = "";

  assertEquals(
    JSON.stringify(wordSimilaritySort(badArg, possibleWords)),
    JSON.stringify(["", "size", "blah", "help", "length"]),
  );
});

Deno.test("wordSimilaritySort() checks empty array", function () {
  const possibleWords: string[] = [];
  const badArg = "";

  assertEquals(
    JSON.stringify(wordSimilaritySort(badArg, possibleWords)),
    "[]",
  );
});
