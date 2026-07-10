// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { mean } from "./mean.ts";

Deno.test("mean() handles basic cases", () => {
  assertEquals(mean([1, 2, 3, 4]), 2.5);
  assertEquals(mean([10]), 10);
  assertEquals(mean([0, 0, 0]), 0);
});

Deno.test("mean() handles decimals", () => {
  assertEquals(mean([1.5, 2.5, 3]), 7 / 3);
});

Deno.test("mean() throws on empty array", () => {
  assertThrows(
    () => mean([]),
    RangeError,
    "`numbers` must contain at least one element",
  );
});
