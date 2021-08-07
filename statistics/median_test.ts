// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { median } from "./median.ts";

Deno.test({
  name: "[statistics/median] empty array",
  fn() {
    assertEquals(median([]), undefined);
  },
});

Deno.test({
  name: "[statistics/median] single element",
  fn() {
    assertEquals(median([1]), 1);
    assertEquals(median([5]), 5);
  },
});

Deno.test({
  name: "[statistics/median] even number of elements",
  fn() {
    assertEquals(median([3, 1]), 2);
    assertEquals(median([10, 5, 25, 19]), 14.5);
  },
});

Deno.test({
  name: "[statistics/median] odd number of elements",
  fn() {
    assertEquals(median([12, 2, 5]), 5);
    assertEquals(median([27, 13, 6, 1, 19]), 13);
  },
});
