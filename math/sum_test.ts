// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { sum } from "./sum.ts";

Deno.test("sum() handles basic cases", () => {
  assertEquals(sum([1, 2, 3, 4]), 10);
  assertEquals(sum([0]), 0);
  assertEquals(sum([-1, 1]), 0);
});

Deno.test("sum() handles empty array", () => {
  assertEquals(sum([]), 0);
});

Deno.test("sum() handles decimals", () => {
  assertEquals(sum([1.5, 2.5, 3]), 7);
});

Deno.test("sum() is accurate for mixed-magnitude inputs", () => {
  assertEquals(sum([1e16, 1, -1e16]), 1);
  assertEquals(sum([1e16, -1e16, 1]), 1);
});

Deno.test("sum() does not drift on long arrays of small values", () => {
  assertEquals(sum(Array.from({ length: 1000 }, () => 0.1)), 100);
});

Deno.test("sum() propagates Infinity without producing NaN", () => {
  assertEquals(sum([Infinity, 1]), Infinity);
  assertEquals(sum([-Infinity, 1]), -Infinity);
  assertEquals(sum([Infinity, -Infinity]), NaN);
});
