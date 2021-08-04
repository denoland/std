// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { sortBy } from "./sort_by.ts";

function sortByTest<T>(
  input: [
    Array<T>,
    | ((el: T) => number)
    | ((el: T) => string)
    | ((el: T) => bigint)
    | ((el: T) => Date),
  ],
  expected: Array<T>,
  message?: string,
) {
  const actual = sortBy(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/sortBy] no mutation",
  fn() {
    const array = ["a", "abc", "ba"];
    sortBy(array, (it) => it.length);

    assertEquals(array, ["a", "abc", "ba"]);
  },
});

Deno.test({
  name: "[collections/sortBy] empty input",
  fn() {
    sortByTest(
      [[], () => 5],
      [],
    );
  },
});

Deno.test({
  name: "[collections/sortBy] identity selector",
  fn() {
    sortByTest(
      [
        [2, 3, 1],
        (it) => it,
      ],
      [1, 2, 3],
    );
  },
});

Deno.test({
  name: "[collections/sortBy] sortings",
  fn() {
    const testArray = [
      { name: "benchmark", stage: 3 },
      { name: "test", stage: 2 },
      { name: "build", stage: 1 },
      { name: "deploy", stage: 4 },
    ];

    sortByTest(
      [
        testArray,
        (it) => it.stage,
      ],
      [
        { name: "build", stage: 1 },
        { name: "test", stage: 2 },
        { name: "benchmark", stage: 3 },
        { name: "deploy", stage: 4 },
      ],
    );
    sortByTest(
      [
        testArray,
        (it) => it.name,
      ],
      [
        { name: "benchmark", stage: 3 },
        { name: "build", stage: 1 },
        { name: "deploy", stage: 4 },
        { name: "test", stage: 2 },
      ],
    );
    sortByTest(
      [
        [
          "9007199254740999",
          "9007199254740991",
          "9007199254740995",
        ],
        (it) => BigInt(it),
      ],
      [
        "9007199254740991",
        "9007199254740995",
        "9007199254740999",
      ],
    );
    sortByTest(
      [
        [
          "February 1, 2022",
          "December 17, 1995",
          "June 12, 2012",
        ],
        (it) => new Date(it),
      ],
      [
        "December 17, 1995",
        "June 12, 2012",
        "February 1, 2022",
      ],
    );
  },
});
