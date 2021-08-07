// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { mean } from "./mean.ts";

Deno.test({
  name: "[statistics/mean] empty array",
  fn() {
    assertEquals(mean([]), undefined);
  },
});

Deno.test({
  name: "[statistics/mean] single element",
  fn() {
    assertEquals(mean([1]), 1);
    assertEquals(mean([5]), 5);
  },
});

Deno.test({
  name: "[statistics/mean] integer mean",
  fn() {
    assertEquals(mean([1, 3]), 2);
    assertEquals(mean([20, 10, 5, 25]), 15);
  },
});

Deno.test({
  name: "[statistics/mean] decimal mean",
  fn() {
    assertEquals(mean([4, 1]), 2.5);
    assertEquals(mean([10, 4, 1, 14]), 7.25);
  },
});

Deno.test({
  name: "[statistics/mean] irrational mean",
  fn() {
    assertEquals(mean([2, 1, 2])!.toFixed(3), "1.667");
    assertEquals(mean([11, 5, 1])!.toFixed(3), "5.667");
  },
});
