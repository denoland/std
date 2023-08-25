// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/mod.ts";
import { closest, similarityCompare, wordSimilaritySort } from "./_util.ts";

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

Deno.test("closest", function () {
  const words = ["hi", "hello", "help"];

  assertEquals(
    JSON.stringify(closest("hep", words)),
    '"hi"',
  );
});

Deno.test("closest", function () {
  const words = ["hi", "hello", "help"];

  // this is why caseSensitive is OFF by default; very unintuitive until something better than levenshtein_distance is used
  assertEquals(
    JSON.stringify(closest("HELP", words, { caseSensitive: true })),
    '"hi"',
  );
});

Deno.test("closest", function () {
  const words = ["HI", "HELLO", "HELP"];

  assertEquals(
    JSON.stringify(closest("he", words, { caseSensitive: true })),
    '"HI"',
  );
});
