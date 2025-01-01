// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
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
  name: "withoutAll() handles no mutation",
  fn() {
    const array = [1, 2, 3, 4];
    withoutAll(array, [2, 3]);
    assertEquals(array, [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "withoutAll() handles empty input",
  fn() {
    withoutAllTest([], [], []);
  },
});

Deno.test({
  name: "withoutAll() handles no matches",
  fn() {
    withoutAllTest([1, 2, 3, 4], [0, 7, 9], [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "withoutAll() handles single match",
  fn() {
    withoutAllTest([1, 2, 3, 4], [1], [2, 3, 4]);
    withoutAllTest([1, 2, 3, 2], [2], [1, 3]);
  },
});

Deno.test({
  name: "withoutAll() handles multiple matches",
  fn() {
    withoutAllTest([1, 2, 3, 4, 6, 3], [1, 2], [3, 4, 6, 3]);
    withoutAllTest([7, 2, 9, 8, 7, 6, 5, 7], [7, 9], [2, 8, 6, 5]);
  },
});

Deno.test({
  name: "withoutAll() leaves duplicate elements",
  fn() {
    withoutAllTest(
      Array.from({ length: 110 }, () => 3),
      [1],
      Array.from({ length: 110 }, () => 3),
    );
  },
});
