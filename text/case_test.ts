// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
  toScreamingSnakeCase,
  toSentenceCase,
  toSnakeCase,
  toTitleCase,
} from "./case.ts";

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

Deno.test("toPascalCase() handles empty string", () => {
  assertEquals(toPascalCase(""), "");
});

Deno.test("toPascalCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "Shruberry";
  assertEquals(toPascalCase(input), expected);
});

Deno.test("toPascalCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "SheTurnedMeIntoANewt";
  assertEquals(toPascalCase(input), expected);
});

Deno.test("toScreamingSnakeCase() handles an empty string", () => {
  assertEquals(toScreamingSnakeCase(""), "");
});

Deno.test("toScreamingSnakeCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "SHRUBERRY";
  assertEquals(toScreamingSnakeCase(input), expected);
});

Deno.test("toScreamingSnakeCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "SHE_TURNED_ME_INTO_A_NEWT";
  assertEquals(toScreamingSnakeCase(input), expected);
});

Deno.test("toSentenceCase() handles an empty string", () => {
  assertEquals(toSentenceCase(""), "");
});

Deno.test("toSentenceCase() converts a single word", () => {
  const input = "Shruberry";
  const expected = "Shruberry";
  assertEquals(toSentenceCase(input), expected);
});

Deno.test("toSentenceCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "She turned me into a newt";
  assertEquals(toSentenceCase(input), expected);
});

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

Deno.test("toTitleCase() handles an empty string", () => {
  assertEquals(toTitleCase(""), "");
});

Deno.test("toTitleCase() converts a single word", () => {
  const input = "shruberry";
  const expected = "Shruberry";
  assertEquals(toTitleCase(input), expected);
});

Deno.test("toTitleCase() converts a sentence", () => {
  const input = "she turned me into a newt";
  const expected = "She Turned Me Into A Newt";
  assertEquals(toTitleCase(input), expected);
});
