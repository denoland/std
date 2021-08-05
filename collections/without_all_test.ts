// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { withoutAll } from "./without_all.ts";

function withoutAllTest<I>(
  input: Array<I>,
  excluded: Array<I>,
  expected: Array<I>,
  message?: string,
) {
  const actual = withoutAll(input, excluded);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/withoutAll] empty input",
  fn() {
    withoutAllTest([], [], []);
  },
});

Deno.test({
  name: "[collections/withoutAll] no matches",
  fn() {
    withoutAllTest([1, 2, 3, 4], [0], [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "[collections/withoutAll] single matche",
  fn() {
    withoutAllTest([1, 2, 3, 4], [1], [2, 3, 4]);
    withoutAllTest([1, 2, 3, 2], [2], [1, 3]);
  },
});

Deno.test({
  name: "[collections/withoutAll] multiple matches",
  fn() {
    withoutAllTest([1, 2, 3, 4, 6, 3], [1], [2, 3, 4, 6, 3]);
    withoutAllTest([7, 2, 9, 8, 7, 6, 5, 7], [7], [2, 9, 8, 6, 5]);
  },
});

Deno.test({
  name: "[collections/withoutAll] large array size",
  fn() {
    const array = Array(200).fill(0);
    array[0] = 1;
    withoutAllTest(array, [0], [1]);
  },
});
