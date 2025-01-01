// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { filterEntries } from "./filter_entries.ts";

function filterEntriesTest<T>(
  input: [Record<string, T>, (entry: [string, T]) => boolean],
  expected: Record<string, T>,
  message?: string,
) {
  const actual = filterEntries(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "filterEntries() handles no mutation",
  fn() {
    const object = { a: 5, b: true };
    filterEntries(object, ([key]) => key !== "a");

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "filterEntries() handles empty input",
  fn() {
    filterEntriesTest(
      [{}, () => true],
      {},
    );
  },
});

Deno.test({
  name: "filterEntries() handles identity",
  fn() {
    filterEntriesTest(
      [
        {
          foo: true,
          bar: "lorem",
          1: -5,
        },
        () => true,
      ],
      {
        foo: true,
        bar: "lorem",
        1: -5,
      },
    );
  },
});

Deno.test({
  name: "filterEntries() handles clean object",
  fn() {
    filterEntriesTest(
      [
        { test: "foo", "": [] },
        () => false,
      ],
      {},
    );
  },
});

Deno.test({
  name: "filterEntries() handles filters",
  fn() {
    filterEntriesTest(
      [
        {
          "Anna": 22,
          "Kim": 24,
          "Karen": 33,
          "Claudio": 11,
          "Karl": 45,
        },
        ([name, age]) => name.startsWith("K") && age > 30,
      ],
      {
        "Karen": 33,
        "Karl": 45,
      },
    );
    filterEntriesTest(
      [
        {
          "A": true,
          "b": "foo",
          "C": 5,
          "d": -2,
          "": false,
        },
        ([key]) => key.toUpperCase() === key,
      ],
      {
        "A": true,
        "C": 5,
        "": false,
      },
    );
  },
});
