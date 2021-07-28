// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { without } from "./without.ts";

function withoutTest<I>(
  input: Array<I>,
  excluded: Array<I>,
  expected: Array<I>,
  message?: string,
) {
  const actual = without(input, ...excluded);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/without] empty input",
  fn() {
    withoutTest([], [], []);
  },
});

Deno.test({
  name: "[collections/without] no matches",
  fn() {
    withoutTest([1, 2, 3, 4], [], [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "[collections/without] single matche",
  fn() {
    withoutTest([1, 2, 3, 4], [1], [2, 3, 4]);
    withoutTest([1, 2, 3, 2], [2], [1, 3]);
  },
});

Deno.test({
  name: "[collections/without] multiple matches",
  fn() {
    withoutTest([1, 2, 3, 4, 6], [1, 3, 6], [2, 4]);
    withoutTest([2, 9, 8, 7, 6, 5], [7, 5], [2, 9, 8, 6]);
    withoutTest([2, 9, 8, 7, 6, 5], [7, 5], [2, 9, 8, 6]);
  },
});
