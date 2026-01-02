// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toConstantCase } from "./unstable_to_constant_case.ts";

Deno.test("toConstantCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "SHRUBERRY";
  assertEquals(toConstantCase(input), expected);
});

Deno.test("toConstantCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "SHE_TURNED_ME_INTO_A_NEWT";
  assertEquals(toConstantCase(input), expected);
});

Deno.test("toConstantCase() converts multiple delimiters", () => {
  const result = toConstantCase("I am up-to-date!");
  const expected = "I_AM_UP_TO_DATE";
  assertEquals(result, expected);
});

Deno.test("toConstantCase() trims whitespace", () => {
  const result = toConstantCase(" deno Is AWESOME ");
  const expected = "DENO_IS_AWESOME";
  assertEquals(result, expected);
});
