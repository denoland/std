// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../testing/asserts.ts";
import { closest, similarityCompare, wordSimilaritySort } from "./mod.ts";

Deno.test("basicWordSimilaritySort", function () {
  const possibleWords: string[] = ["length", "size", "blah", "help"];
  const badArg = "hep";

  assertEquals(
    wordSimilaritySort(badArg, possibleWords).join(", "),
    "help, size, blah, length",
  );
});

Deno.test("emptyStringSimilaritySort", function () {
  const possibleWords: string[] = ["length", "size", "blah", "help", ""];
  const badArg = "";

  assertEquals(
    JSON.stringify(wordSimilaritySort(badArg, possibleWords)),
    JSON.stringify(["", "size", "blah", "help", "length"]),
  );
});

Deno.test("emptyArraySimilaritySort", function () {
  const possibleWords: string[] = [];
  const badArg = "";

  assertEquals(
    JSON.stringify(wordSimilaritySort(badArg, possibleWords)),
    "[]",
  );
});

Deno.test("similarityCompare", function () {
  const words = ["hi", "hello", "help"];

  assertEquals(
    JSON.stringify(words.sort(similarityCompare("hep"))),
    '["help","hi","hello"]',
  );
});
