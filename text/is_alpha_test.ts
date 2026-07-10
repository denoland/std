// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { isAlpha } from "./is_alpha.ts";

Deno.test("isAlpha() returns true for alphabetic strings", () => {
  assertEquals(isAlpha("hello"), true);
  assertEquals(isAlpha("HELLO"), true);
});

Deno.test("isAlpha() returns false for strings with numbers", () => {
  assertEquals(isAlpha("hello123"), false);
});

Deno.test("isAlpha() returns false for strings with special characters", () => {
  assertEquals(isAlpha("hello world"), false);
  assertEquals(isAlpha("hello!"), false);
});

Deno.test("isAlpha() returns false for empty string", () => {
  assertEquals(isAlpha(""), false);
});
