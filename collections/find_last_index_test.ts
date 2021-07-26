// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { findLastIndex } from "./find_last_index.ts";

function findLastIndexTest<I>(
  input: [Array<I>, (element: I) => boolean],
  expected: number,
  message?: string,
) {
  const actual = findLastIndex(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/findLast] empty input",
  fn() {
    findLastIndexTest([[], (_) => true], -1);
  },
});

Deno.test({
  name: "[collections/findLastIndex] no matches",
  fn() {
    findLastIndexTest([[9, 11, 13], (it) => it % 2 === 0], -1);
    findLastIndexTest([["foo", "bar"], (it) => it.startsWith("z")], -1);
  },
});

Deno.test({
  name: "[collections/findLast] only match",
  fn() {
    findLastIndexTest([[9, 12, 13], (it) => it % 2 === 0], 1);
    findLastIndexTest([["zap", "foo", "bar"], (it) => it.startsWith("z")], 0);
  },
});
