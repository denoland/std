// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { stdDev } from "./std_dev.ts";

Deno.test("stdDev() handles basic cases", () => {
  assertEquals(stdDev([2, 4, 4, 4, 5, 5, 7, 9]), 2);
});

Deno.test("stdDev() handles two elements", () => {
  assertEquals(stdDev([1, 3]), 1);
});

Deno.test("stdDev() handles all same values", () => {
  assertEquals(stdDev([5, 5, 5]), 0);
});

Deno.test("stdDev() throws on less than two elements", () => {
  assertThrows(
    () => stdDev([1]),
    RangeError,
    "`numbers` must contain at least two elements",
  );
});
