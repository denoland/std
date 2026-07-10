// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { isOdd } from "./is_odd.ts";

Deno.test("isOdd() returns true for odd numbers", () => {
  assertEquals(isOdd(5), true);
  assertEquals(isOdd(-3), true);
});

Deno.test("isOdd() returns false for even numbers", () => {
  assertEquals(isOdd(4), false);
  assertEquals(isOdd(0), false);
});
