// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { reduceGroups } from "./reduce_groups.ts";

function reduceGroupsTest<T, A>(
  input: [
    record: Record<string, ReadonlyArray<T>>,
    reducer: (accumulator: A, current: T) => A,
    initialValue: A,
  ],
  expected: Record<string, A>,
  message?: string,
) {
  const actual = reduceGroups(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "mapEntries() handles no mutation",
  fn() {
    const input = {
      Woody: [2, 3, 1, 4],
      Buzz: [5, 9],
    };

    reduceGroups(input, (sum, it) => sum + it, 0);

    assertEquals(input, {
      Woody: [2, 3, 1, 4],
      Buzz: [5, 9],
    });
  },
});

Deno.test({
  name: "mapEntries() handles array of numbers",
  fn() {
    reduceGroupsTest(
      [
        {
          Woody: [2, 3, 1, 4],
          Buzz: [5, 9],
        },
        (sum, it) => sum + it,
        0,
      ],
      {
        Woody: 10,
        Buzz: 14,
      },
    );
  },
});

Deno.test({
  name: "mapEntries() handles array of strings",
  fn() {
    reduceGroupsTest(
      [
        {
          Woody: ["foo", "bar"],
          Buzz: ["foo", "bar", "baz"],
        },
        (sum, it) => sum + it + " ",
        "",
      ],
      {
        Woody: "foo bar ",
        Buzz: "foo bar baz ",
      },
    );
  },
});

Deno.test({
  name: "mapEntries() handles mapper",
  fn() {
    reduceGroupsTest(
      [
        {
          Woody: [{ val: 14 }, { val: 24 }],
          Buzz: [{ val: 1 }, { val: 2 }, { val: 3 }, { val: 4 }],
        },
        (sum, it) => sum + it.val,
        0,
      ],
      {
        Woody: 38,
        Buzz: 10,
      },
    );
  },
});

Deno.test({
  name: "mapEntries() handles initial value",
  fn() {
    reduceGroupsTest(
      [
        {
          Woody: [],
          Buzz: [],
        },
        (sum, it) => sum + it,
        24,
      ],
      {
        Woody: 24,
        Buzz: 24,
      },
    );
  },
});

Deno.test({
  name: "mapEntries() handles empty input",
  fn() {
    reduceGroupsTest([{}, () => 0, 0], {});
  },
});
