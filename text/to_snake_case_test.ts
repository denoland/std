// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toSnakeCase } from "./mod.ts";

Deno.test("toSnakeCase() handles an empty string", () => {
  assertEquals(toSnakeCase(""), "");
});

Deno.test("toSnakeCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "shruberry";
  assertEquals(toSnakeCase(input), expected);
});

Deno.test("toSnakeCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "she_turned_me_into_a_newt";
  assertEquals(toSnakeCase(input), expected);
});

Deno.test("toSnakeCase() converts multiple delimiters", () => {
  const result = toSnakeCase("I am up-to-date!");
  const expected = "i_am_up_to_date";
  assertEquals(result, expected);
});

Deno.test("toSnakeCase() trims whitespace", () => {
  const result = toSnakeCase(" deno Is AWESOME ");
  const expected = "deno_is_awesome";
  assertEquals(result, expected);
});

Deno.test("toSnakeCase() splits words before and after the numbers", () => {
  assertEquals(toSnakeCase("str2Num"), "str_2_num");
  assertEquals(toSnakeCase("Str2Num"), "str_2_num");
});
