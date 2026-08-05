// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { variance } from "./variance.ts";

Deno.test("variance() computes the sample variance by default", () => {
  assertEquals(variance([2, 4, 4, 4, 5, 5, 7, 9]), 32 / 7);
});

Deno.test("variance() computes the population variance when requested", () => {
  assertEquals(variance([2, 4, 4, 4, 5, 5, 7, 9], { population: true }), 4);
});

Deno.test("variance() handles two elements", () => {
  assertEquals(variance([1, 3]), 2);
  assertEquals(variance([1, 3], { population: true }), 1);
});

Deno.test("variance() handles all same values", () => {
  assertEquals(variance([5, 5, 5]), 0);
});

Deno.test("variance() returns 0 for a single element as population variance", () => {
  assertEquals(variance([42], { population: true }), 0);
});

Deno.test("variance() throws on empty array", () => {
  assertThrows(
    () => variance([]),
    RangeError,
    "`numbers` must contain at least one element",
  );
});

Deno.test("variance() throws on a single element for sample variance", () => {
  assertThrows(
    () => variance([1]),
    RangeError,
    "`numbers` must contain at least two elements",
  );
});
