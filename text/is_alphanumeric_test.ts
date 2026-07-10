// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { isAlphanumeric } from "./is_alphanumeric.ts";

Deno.test("isAlphanumeric() returns true for alphanumeric strings", () => {
  assertEquals(isAlphanumeric("hello123"), true);
  assertEquals(isAlphanumeric("abc"), true);
  assertEquals(isAlphanumeric("123"), true);
});

Deno.test("isAlphanumeric() returns false for strings with special characters", () => {
  assertEquals(isAlphanumeric("hello 123"), false);
  assertEquals(isAlphanumeric("hello!"), false);
});

Deno.test("isAlphanumeric() returns false for empty string", () => {
  assertEquals(isAlphanumeric(""), false);
});
