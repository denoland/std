// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../assert/mod.ts";
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

Deno.test("similarityCompare", function () {
  const words = ["hi", "hello", "help", "HOWDY"];

  assertEquals(
    JSON.stringify(
      words.sort(similarityCompare("HI", { caseSensitive: true })),
    ),
    '["hi","help","HOWDY","hello"]',
  );
});

Deno.test("closest - basic", function () {
  const words = ["hi", "hello", "help"];

  assertEquals(
    JSON.stringify(closest("hep", words)),
    '"hi"',
  );
});

Deno.test("closest - caseSensitive1", function () {
  const words = ["hi", "hello", "help"];

  // this is why caseSensitive is OFF by default; very unintuitive until something better than levenshtein_distance is used
  assertEquals(
    JSON.stringify(closest("HELP", words, { caseSensitive: true })),
    '"hi"',
  );
});

Deno.test("closest - caseSensitive2", function () {
  const words = ["HI", "HELLO", "HELP"];

  assertEquals(
    JSON.stringify(closest("he", words, { caseSensitive: true })),
    '"HI"',
  );
});

Deno.test("closest - empty input", function () {
  assertThrows(
    () => closest("he", []),
    Error,
    "When using closest(), the possibleWords array must contain at least one word",
  );
});
