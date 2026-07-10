// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { flatten } from "./flatten.ts";

Deno.test({
  name: "flatten() flattens nested arrays one level",
  fn() {
    assertEquals(
      flatten([[1, 2], [3, 4], [5]]),
      [1, 2, 3, 4, 5],
    );
  },
});

Deno.test({
  name: "flatten() handles empty subarrays",
  fn() {
    assertEquals(flatten([[1], [], [2]]), [1, 2]);
  },
});

Deno.test({
  name: "flatten() handles empty outer array",
  fn() {
    assertEquals(flatten([]), []);
  },
});

Deno.test({
  name: "flatten() does not deep flatten",
  fn() {
    const result = flatten([[[1]], [[2]]]);
    assertEquals(result, [[1], [2]]);
  },
});
