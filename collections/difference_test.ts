// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { difference } from "./difference.ts";

Deno.test({
  name: "difference() returns elements in a not in b",
  fn() {
    assertEquals(difference([1, 2, 3, 4], [2, 4]), [1, 3]);
  },
});

Deno.test({
  name: "difference() returns empty array when all elements are excluded",
  fn() {
    assertEquals(difference([1, 2], [1, 2]), []);
  },
});

Deno.test({
  name: "difference() returns all elements when no overlap",
  fn() {
    assertEquals(difference([1, 2], [3, 4]), [1, 2]);
  },
});

Deno.test({
  name: "difference() handles empty arrays",
  fn() {
    assertEquals(difference([], [1, 2]), []);
    assertEquals(difference([1, 2], []), [1, 2]);
  },
});

Deno.test({
  name: "difference() handles duplicates in input",
  fn() {
    assertEquals(difference([1, 1, 2, 2, 3], [2]), [1, 1, 3]);
  },
});
