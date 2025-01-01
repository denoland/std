// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { aggregateGroups } from "./aggregate_groups.ts";

function aggregateGroupsTest<T, A>(
  input: [
    Record<string, ReadonlyArray<T>>,
    (current: T, key: string, first: boolean, accumulator?: A) => A,
  ],
  expected: Record<string, A>,
  message?: string,
) {
  const actual = aggregateGroups(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "aggregateGroups() handles no mutation",
  fn() {
    const input = {
      Woody: [2, 3, 1, 4],
      Buzz: [5, 9],
    };

    aggregateGroups(input, () => 5);

    assertEquals(input, {
      Woody: [2, 3, 1, 4],
      Buzz: [5, 9],
    });
  },
});

Deno.test({
  name: "aggregateGroups() handles string building using all params",
  fn() {
    aggregateGroupsTest(
      [
        {
          "Curry": ["spicy", "vegan"],
          "Omelette": ["creamy", "vegetarian"],
        },
        (current, key, first, acc) => {
          if (first) {
            return `${key} is ${current}`;
          }

          return `${acc} and ${current}`;
        },
      ],
      {
        "Curry": "Curry is spicy and vegan",
        "Omelette": "Omelette is creamy and vegetarian",
      },
    );
  },
});

Deno.test({
  name: "aggregateGroups() handles sum ignoring non reduce params",
  fn() {
    aggregateGroupsTest(
      [
        {
          Woody: [1, 2, 3],
          Buzz: [5, 6, 7],
        },
        (current, _key, _first, acc) => current + (acc ?? 0),
      ],
      {
        Woody: 6,
        Buzz: 18,
      },
    );
  },
});

Deno.test({
  name: "aggregateGroups() handles empty input",
  fn() {
    aggregateGroupsTest([
      {},
      () => 1,
    ], {});
  },
});
