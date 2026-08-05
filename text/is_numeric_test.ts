// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { isNumeric } from "./is_numeric.ts";

Deno.test("isNumeric() returns true for numeric strings", () => {
  assertEquals(isNumeric("123"), true);
  assertEquals(isNumeric("0"), true);
});

Deno.test("isNumeric() returns false for strings with letters", () => {
  assertEquals(isNumeric("123abc"), false);
  assertEquals(isNumeric("abc"), false);
});

Deno.test("isNumeric() returns false for strings with special characters", () => {
  assertEquals(isNumeric("12 3"), false);
});

Deno.test("isNumeric() returns false for empty string", () => {
  assertEquals(isNumeric(""), false);
});
