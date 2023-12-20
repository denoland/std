// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertThrows } from "../assert/mod.ts";
import { closestString } from "./closest_string.ts";

Deno.test("closestString() handles basic example", function () {
  const words = ["hi", "hello", "help"];

  assertEquals(
    JSON.stringify(closestString("hep", words)),
    '"help"',
  );
});

Deno.test("closestString() handles case sensitive example 1", function () {
  const words = ["hi", "hello", "help"];

  // this is why caseSensitive is OFF by default; very unintuitive until something better than levenshtein_distance is used
  assertEquals(
    JSON.stringify(closestString("HELP", words, { caseSensitive: true })),
    '"hi"',
  );
});

Deno.test("closestString() handles case sensitive example 2", function () {
  const words = ["HI", "HELLO", "HELP"];

  assertEquals(
    JSON.stringify(closestString("he", words, { caseSensitive: true })),
    '"HI"',
  );
});

Deno.test("closestString() handles empty input", function () {
  assertThrows(
    () => closestString("he", []),
    Error,
    "When using closestString(), the possibleWords array must contain at least one word",
  );
});
