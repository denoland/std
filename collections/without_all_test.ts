// Copyright 2018-2026 the Deno authors. MIT license.

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

Deno.test("withoutAll() handles generators", () => {
  function* genInput() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
  }
  function* genExcluded() {
    yield 2;
    yield 3;
  }
  const result = withoutAll(genInput(), genExcluded());
  assertEquals(result, [1, 4]);
});

Deno.test("withoutAll() handles iterators", () => {
  const input = new Set([1, 2, 3, 4]);
  const excluded = new Set([2, 3]);
  const result = withoutAll(input.values(), excluded.values());
  assertEquals(result, [1, 4]);
});

Deno.test("withoutAll() handles a mix of inputs", () => {
  const a = [1, 2, 3, 4];
  const b = new Set([2, 3, 5]);
  assertEquals(withoutAll(a, b), [1, 4], "Array and Set");
  assertEquals(withoutAll(b, a), [5], "Set and Array");
});

Deno.test("withoutAll() handles allows excluded to be a superset of types", () => {
  const a = [1, 2, 3, 4];
  const b = [1, "other", 3, 4];
  assertEquals(withoutAll(a, b), [2]);
});

Deno.test("withoutAll() works with sets", () => {
  const a = new Set([1, 2, 3, 4]);
  const b = new Set([2, 3]);
  assertEquals(withoutAll(a, b), [1, 4]);
});
