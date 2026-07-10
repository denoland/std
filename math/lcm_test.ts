// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { lcm } from "./lcm.ts";

Deno.test("lcm() handles basic cases", () => {
  assertEquals(lcm(12, 8), 24);
  assertEquals(lcm(7, 3), 21);
});

Deno.test("lcm() handles zero", () => {
  assertEquals(lcm(0, 5), 0);
  assertEquals(lcm(5, 0), 0);
});

Deno.test("lcm() handles negative numbers", () => {
  assertEquals(lcm(-12, 8), 24);
  assertEquals(lcm(12, -8), 24);
});

Deno.test("lcm() returns the number when both are the same", () => {
  assertEquals(lcm(7, 7), 7);
});
