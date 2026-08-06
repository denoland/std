// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { lcm } from "./lcm.ts";

Deno.test("lcm() handles basic cases", () => {
  assertEquals(lcm(12, 8), 24);
  assertEquals(lcm(7, 3), 21);
});

Deno.test("lcm() is exact when the product of the inputs exceeds 2^53", () => {
  assertEquals(lcm(94998385, 94998005), 94996390033915);
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

Deno.test("lcm() throws on non-integer input", () => {
  assertThrows(() => lcm(NaN, 5), RangeError, "`a` and `b` must be integers");
  assertThrows(
    () => lcm(5, Infinity),
    RangeError,
    "`a` and `b` must be integers",
  );
  assertThrows(() => lcm(1.5, 5), RangeError, "`a` and `b` must be integers");
  assertThrows(() => lcm(0, 1.5), RangeError, "`a` and `b` must be integers");
});
