// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import {
  toCamelCase,
  toKebabCase,
  toPascalCase,
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
Deno.test({
  name: "toCamelCase() converts multiple delimiters",
  fn() {
    const result = toCamelCase("I am up-to-date!");
    const expected = "iAmUpToDate";
    assertEquals(result, expected);
  },
});
Deno.test({
  name: "toCamelCase() trims whitespace",
  fn() {
    const result = toCamelCase(" deno Is AWESOME ");
    const expected = "denoIsAwesome";
    assertEquals(result, expected);
  },
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

Deno.test({
  name: "toKebabCase() converts multiple delimiters",
  fn() {
    const result = toKebabCase("I am up-to-date!");
    const expected = "i-am-up-to-date";
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "toKebabCase() trims whitespace",
  fn() {
    const result = toKebabCase(" deno Is AWESOME ");
    const expected = "deno-is-awesome";
    assertEquals(result, expected);
  },
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

Deno.test({
  name: "toPascalCase() converts multiple delimiters",
  fn() {
    const result = toPascalCase("I am up-to-date!");
    const expected = "IAmUpToDate";
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "toPascalCase() trims whitespace",
  fn() {
    const result = toPascalCase(" deno Is AWESOME ");
    const expected = "DenoIsAwesome";
    assertEquals(result, expected);
  },
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

Deno.test({
  name: "toSentenceCase() converts multiple delimiters",
  fn() {
    const result = toSentenceCase("I am up-to-date!");
    const expected = "I am up-to-date!";
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "toSentenceCase() trims whitespace",
  fn() {
    const result = toSentenceCase(" deno Is Awesome ");
    const expected = "Deno is awesome";
    assertEquals(result, expected);
  },
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

Deno.test({
  name: "toSnakeCase() converts multiple delimiters",
  fn() {
    const result = toSnakeCase("I am up-to-date!");
    const expected = "i_am_up_to_date";
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "toSnakeCase() trims whitespace",
  fn() {
    const result = toSnakeCase(" deno Is AWESOME ");
    const expected = "deno_is_awesome";
    assertEquals(result, expected);
  },
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

Deno.test({
  name: "toTitleCase() converts multiple delimiters",
  fn() {
    const result = toTitleCase("I am up-to-date!");
    const expected = "I Am Up-to-date!";
    assertEquals(result, expected);
  },
});

Deno.test({
  name: "toTitleCase() trims whitespace",
  fn() {
    const result = toTitleCase(" deno Is AWESOME ");
    const expected = "Deno Is Awesome";
    assertEquals(result, expected);
  },
});
