// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { mapNotNullish } from "./map_not_nullish.ts";
import * as unstable from "./unstable_map_not_nullish.ts";

function mapNotNullishTest<T, O>(
  input: [Array<T>, (el: T) => O | undefined | null],
  expected: Array<O>,
  message?: string,
) {
  const actual = mapNotNullish(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "mapNotNullish() handles no mutation",
  fn() {
    const array = [1, 2, 3, 4];
    mapNotNullish(array, (it) => it * 2);

    assertEquals(array, [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "mapNotNullish() handles empty input",
  fn() {
    mapNotNullishTest(
      [[], (it) => it],
      [],
    );
  },
});

Deno.test({
  name: "mapNotNullish() handles identity",
  fn() {
    mapNotNullishTest(
      [
        [[], 1, 3],
        (it) => it,
      ],
      [[], 1, 3],
    );
  },
});

Deno.test({
  name: "mapNotNullish() handles mappers without nullish values",
  fn() {
    mapNotNullishTest(
      [
        ["Anna", "Kim", "Hans"],
        (it) => it.charAt(0),
      ],
      ["A", "K", "H"],
    );
    mapNotNullishTest(
      [
        [3, 4, 5, 6],
        (it) => it * 2,
      ],
      [6, 8, 10, 12],
    );
  },
});

Deno.test({
  name: "mapNotNullish() handles mappers with nullish values",
  fn() {
    mapNotNullishTest(
      [
        ["Errors: 5", "Success", "Warnings: 10", "..."],
        (it) =>
          it.match(/\w+: (?<numberOfProblems>\d+)/u)?.groups?.numberOfProblems,
      ],
      ["5", "10"],
    );
    mapNotNullishTest(
      [
        [
          { first: "Kim", middle: undefined, last: "Example" },
          { first: "Arthur", middle: "Hans", last: "Somename" },
          { first: "Laura", middle: "Marija", last: "Anothername" },
          { first: "Sam", middle: null, last: "Smith" },
        ],
        (it) => it.middle,
      ],
      ["Hans", "Marija"],
    );
  },
});

Deno.test({
  name: "unstable.mapNotNullish() passes index to transformer",
  fn() {
    const result = unstable.mapNotNullish(
      [1, 2, 3, 4],
      (it, index) => index === 1 ? null : it + index,
    );
    assertEquals(result, [1, 5, 7]);
  },
});
