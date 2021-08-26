// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { filterNotNullish } from "./filter_not_nullish.ts";

function filterNotNullishTest<T>(
  input: [Array<T>],
  expected: Array<T>,
  message?: string,
) {
  const actual = filterNotNullish(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/filterNotNullish] remove nullish values",
  fn() {
    filterNotNullishTest([[1, 2, 3, undefined, null]], [1, 2, 3]);
  },
});

Deno.test({
  name: "[collections/filterNotNullish] no mutation",
  fn() {
    const input = [1, 2, 3, 4];
    filterNotNullish(input);

    assertEquals(input, [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "[collections/filterNotNullish] empty input",
  fn() {
    filterNotNullishTest([[]], []);
  },
});

Deno.test({
  name: "[collections/filterNotNullish] mixed types",
  fn() {
    filterNotNullishTest(
      [[1, "Kim", true, { name: "Kim" }, ["Kim"], undefined, null]],
      [1, "Kim", true, { name: "Kim" }, ["Kim"]],
    );
  },
});

Deno.test({
  name: "[collections/filterNotNullish] keep falsy values",
  fn() {
    filterNotNullishTest(
      [[0, "", false, {}, [], undefined, null]],
      [0, "", false, {}, []],
    );
  },
});
