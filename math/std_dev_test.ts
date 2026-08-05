// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { stdDev } from "./std_dev.ts";

Deno.test("stdDev() computes the sample standard deviation by default", () => {
  assertEquals(stdDev([2, 4, 4, 4, 5, 5, 7, 9]), Math.sqrt(32 / 7));
});

Deno.test("stdDev() computes the population standard deviation when requested", () => {
  assertEquals(stdDev([2, 4, 4, 4, 5, 5, 7, 9], { population: true }), 2);
});

Deno.test("stdDev() handles two elements", () => {
  assertEquals(stdDev([1, 3]), Math.sqrt(2));
  assertEquals(stdDev([1, 3], { population: true }), 1);
});

Deno.test("stdDev() handles all same values", () => {
  assertEquals(stdDev([5, 5, 5]), 0);
});

Deno.test("stdDev() returns 0 for a single element as population standard deviation", () => {
  assertEquals(stdDev([42], { population: true }), 0);
});

Deno.test("stdDev() throws on empty array", () => {
  assertThrows(
    () => stdDev([]),
    RangeError,
    "`numbers` must contain at least one element",
  );
});

Deno.test("stdDev() throws on a single element for sample standard deviation", () => {
  assertThrows(
    () => stdDev([1]),
    RangeError,
    "`numbers` must contain at least two elements",
  );
});
