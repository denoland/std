// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { capitalize } from "./capitalize.ts";

Deno.test("capitalize() capitalizes a lowercase string", () => {
  assertEquals(capitalize("hello"), "Hello");
});

Deno.test("capitalize() lowercases the rest of the string", () => {
  assertEquals(capitalize("hELLO"), "Hello");
});

Deno.test("capitalize() handles empty string", () => {
  assertEquals(capitalize(""), "");
});

Deno.test("capitalize() handles single character", () => {
  assertEquals(capitalize("a"), "A");
});
