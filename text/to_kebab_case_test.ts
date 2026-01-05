// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toKebabCase } from "./mod.ts";

Deno.test("toKebabCase() handles an empty string", () => {
  assertEquals(toKebabCase(""), "");
});

Deno.test("toKebabCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "shruberry";
  assertEquals(toKebabCase(input), expected);
});

Deno.test("toKebabCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "she-turned-me-into-a-newt";
  assertEquals(toKebabCase(input), expected);
});

Deno.test("toKebabCase() converts multiple delimiters", () => {
  const result = toKebabCase("I am up-to-date!");
  const expected = "i-am-up-to-date";
  assertEquals(result, expected);
});

Deno.test("toKebabCase() trims whitespace", () => {
  const result = toKebabCase(" deno Is AWESOME ");
  const expected = "deno-is-awesome";
  assertEquals(result, expected);
});
