// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { median } from "./median.ts";

Deno.test("median() handles odd length", () => {
  assertEquals(median([1, 2, 3, 4, 5]), 3);
});

Deno.test("median() handles even length", () => {
  assertEquals(median([1, 2, 3, 4]), 2.5);
});

Deno.test("median() handles single element", () => {
  assertEquals(median([42]), 42);
});

Deno.test("median() handles unsorted input", () => {
  assertEquals(median([5, 1, 3, 2, 4]), 3);
});

Deno.test("median() throws on empty array", () => {
  assertThrows(
    () => median([]),
    RangeError,
    "`numbers` must contain at least one element",
  );
});
