// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { mode } from "./mode.ts";

Deno.test("mode() handles unimodal data", () => {
  assertEquals(mode([1, 2, 2, 3, 4]), [2]);
});

Deno.test("mode() handles multimodal data", () => {
  assertEquals(mode([1, 1, 2, 2, 3]), [1, 2]);
});

Deno.test("mode() handles all same values", () => {
  assertEquals(mode([5, 5, 5]), [5]);
});

Deno.test("mode() handles single element", () => {
  assertEquals(mode([42]), [42]);
});

Deno.test("mode() throws on empty array", () => {
  assertThrows(
    () => mode([]),
    RangeError,
    "`numbers` must contain at least one element",
  );
});
