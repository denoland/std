// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { isEven } from "./is_even.ts";

Deno.test("isEven() returns true for even numbers", () => {
  assertEquals(isEven(4), true);
  assertEquals(isEven(0), true);
  assertEquals(isEven(-2), true);
});

Deno.test("isEven() returns false for odd numbers", () => {
  assertEquals(isEven(5), false);
  assertEquals(isEven(-3), false);
});
