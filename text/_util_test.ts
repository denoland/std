// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../assert/mod.ts";
import { closestString, similarityCompare, wordSimilaritySort } from "./_util.ts";

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

Deno.test("similarityCompare", function () {
  const words = ["hi", "hello", "help", "HOWDY"];

  assertEquals(
    JSON.stringify(
      words.sort(similarityCompare("HI", { caseSensitive: true })),
    ),
    '["hi","help","HOWDY","hello"]',
  );
});

Deno.test("closestString - basic", function () {
  const words = ["hi", "hello", "help"];

  assertEquals(
    JSON.stringify(closestString("hep", words)),
    '"hi"',
  );
});

Deno.test("closestString - caseSensitive1", function () {
  const words = ["hi", "hello", "help"];

  // this is why caseSensitive is OFF by default; very unintuitive until something better than levenshtein_distance is used
  assertEquals(
    JSON.stringify(closestString("HELP", words, { caseSensitive: true })),
    '"hi"',
  );
});

Deno.test("closestString - caseSensitive2", function () {
  const words = ["HI", "HELLO", "HELP"];

  assertEquals(
    JSON.stringify(closestString("he", words, { caseSensitive: true })),
    '"HI"',
  );
});

Deno.test("closestString - empty input", function () {
  assertThrows(
    () => closestString("he", []),
    Error,
    "When using closestString(), the possibleWords array must contain at least one word",
  );
});
