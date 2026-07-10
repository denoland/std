// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { variance } from "./variance.ts";

Deno.test("variance() handles basic cases", () => {
  assertEquals(variance([2, 4, 4, 4, 5, 5, 7, 9]), 4);
});

Deno.test("variance() handles two elements", () => {
  assertEquals(variance([1, 3]), 1);
});

Deno.test("variance() handles all same values", () => {
  assertEquals(variance([5, 5, 5]), 0);
});

Deno.test("variance() throws on less than two elements", () => {
  assertThrows(
    () => variance([1]),
    RangeError,
    "`numbers` must contain at least two elements",
  );
  assertThrows(
    () => variance([]),
    RangeError,
    "`numbers` must contain at least two elements",
  );
});
