// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { mode } from "./mode.ts";

Deno.test({
  name: "[statistics/mode] empty array",
  fn() {
    assertEquals(mode([]), undefined);
  },
});

Deno.test({
  name: "[statistics/mode] single element",
  fn() {
    assertEquals(mode([1]), new Set([1]));
    assertEquals(mode([5]), new Set([5]));
  },
});

Deno.test({
  name: "[statistics/mode] one mode",
  fn() {
    assertEquals(mode([2, 2]), new Set([2]));
    assertEquals(mode([1, 5, 7, 9, 7]), new Set([7]));
    assertEquals(mode([8, 20, 20, 9, 20, 8]), new Set([20]));
  },
});

Deno.test({
  name: "[statistics/mode] multiple modes",
  fn() {
    assertEquals(mode([2, 4]), new Set([2, 4]));
    assertEquals(mode([1, 8, 1, 8]), new Set([1, 8]));
    assertEquals(mode([8, 20, 20, 9, 20, 8, 8, 9]), new Set([8, 20]));
    assertEquals(mode([1, 3, 4, 5, 3, 1, 4]), new Set([1, 3, 4]))
  },
});