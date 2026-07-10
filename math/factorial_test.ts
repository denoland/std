// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { factorial } from "./factorial.ts";

Deno.test("factorial() handles basic cases", () => {
  assertEquals(factorial(5), 120);
  assertEquals(factorial(3), 6);
  assertEquals(factorial(1), 1);
});

Deno.test("factorial() handles zero", () => {
  assertEquals(factorial(0), 1);
});

Deno.test("factorial() throws for negative numbers", () => {
  assertThrows(
    () => factorial(-1),
    RangeError,
    "`n` must be a non-negative integer",
  );
});

Deno.test("factorial() throws for non-integers", () => {
  assertThrows(
    () => factorial(1.5),
    RangeError,
    "`n` must be a non-negative integer",
  );
});
