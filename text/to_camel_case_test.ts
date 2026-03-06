// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toCamelCase } from "./mod.ts";

Deno.test("toCamelCase() handles an empty string", () => {
  assertEquals(toCamelCase(""), "");
});

Deno.test("toCamelCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "shruberry";
  assertEquals(toCamelCase(input), expected);
});

Deno.test("toCamelCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "sheTurnedMeIntoANewt";
  assertEquals(toCamelCase(input), expected);
});

Deno.test("toCamelCase() converts multiple delimiters", () => {
  const result = toCamelCase("I am up-to-date!");
  const expected = "iAmUpToDate";
  assertEquals(result, expected);
});

Deno.test("toCamelCase() trims whitespace", () => {
  const result = toCamelCase(" deno Is AWESOME ");
  const expected = "denoIsAwesome";
  assertEquals(result, expected);
});
