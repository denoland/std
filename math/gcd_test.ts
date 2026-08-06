// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { gcd } from "./gcd.ts";

Deno.test("gcd() handles basic cases", () => {
  assertEquals(gcd(12, 8), 4);
  assertEquals(gcd(7, 3), 1);
  assertEquals(gcd(0, 5), 5);
  assertEquals(gcd(5, 0), 5);
});

Deno.test("gcd() handles negative numbers", () => {
  assertEquals(gcd(-12, 8), 4);
  assertEquals(gcd(12, -8), 4);
  assertEquals(gcd(-12, -8), 4);
});

Deno.test("gcd() handles same numbers", () => {
  assertEquals(gcd(7, 7), 7);
});

Deno.test("gcd() throws on non-integer input", () => {
  assertThrows(() => gcd(NaN, 5), RangeError, "`a` and `b` must be integers");
  assertThrows(() => gcd(5, NaN), RangeError, "`a` and `b` must be integers");
  assertThrows(
    () => gcd(Infinity, 5),
    RangeError,
    "`a` and `b` must be integers",
  );
  assertThrows(
    () => gcd(5, -Infinity),
    RangeError,
    "`a` and `b` must be integers",
  );
  assertThrows(() => gcd(1.5, 5), RangeError, "`a` and `b` must be integers");
});
