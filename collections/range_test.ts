// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals, assertThrows } from "@std/assert";
import { range } from "./range.ts";

Deno.test({
  name: "range() generates sequence with only end argument",
  fn() {
    assertEquals(range(5), [0, 1, 2, 3, 4]);
  },
});

Deno.test({
  name: "range() generates sequence with start and end",
  fn() {
    assertEquals(range(1, 5), [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "range() generates sequence with step",
  fn() {
    assertEquals(range(0, 10, { step: 2 }), [0, 2, 4, 6, 8]);
  },
});

Deno.test({
  name: "range() generates descending sequence",
  fn() {
    assertEquals(range(5, 0, { step: -1 }), [5, 4, 3, 2, 1]);
  },
});

Deno.test({
  name: "range() returns empty array when start equals end",
  fn() {
    assertEquals(range(5, 5), []);
  },
});

Deno.test({
  name: "range() returns empty array when start <= end for descending",
  fn() {
    assertEquals(range(0, 0, { step: -1 }), []);
    assertEquals(range(1, 2, { step: -1 }), []);
  },
});

Deno.test({
  name: "range() throws on step = 0",
  fn() {
    assertThrows(
      () => range(0, 5, { step: 0 }),
      RangeError,
      "`step` must not be zero",
    );
  },
});

Deno.test({
  name: "range() throws on non-finite numbers",
  fn() {
    assertThrows(
      () => range(Infinity, 5),
      RangeError,
      "`start` and `end` must be finite numbers",
    );
  },
});
