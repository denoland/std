// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { partitionEntries } from "./partition_entries.ts";

function partitionEntriesTest<T>(
  input: [Record<string, T>, (entry: [string, T]) => boolean],
  expected: [match: Record<string, T>, rest: Record<string, T>],
  message?: string,
) {
  const actual = partitionEntries(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "partitionEntries() handles no mutation",
  fn() {
    const object = { a: 5, b: true };
    partitionEntries(object, ([key]) => key !== "a");

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "partitionEntries() handles empty input",
  fn() {
    partitionEntriesTest(
      [{}, () => true],
      [{}, {}],
    );
  },
});

Deno.test({
  name: "partitionEntries() handles identity",
  fn() {
    partitionEntriesTest(
      [
        {
          foo: true,
          bar: "lorem",
          1: -5,
        },
        () => true,
      ],
      [{
        foo: true,
        bar: "lorem",
        1: -5,
      }, {}],
    );
  },
});

Deno.test({
  name: "partitionEntries() handles clean object",
  fn() {
    partitionEntriesTest(
      [
        { test: "foo", "": [] },
        () => false,
      ],
      [{}, { test: "foo", "": [] }],
    );
  },
});

Deno.test({
  name: "partitionEntries() handles filters",
  fn() {
    partitionEntriesTest(
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
      [
        {
          "Karen": 33,
          "Karl": 45,
        },
        {
          "Anna": 22,
          "Kim": 24,
          "Claudio": 11,
        },
      ],
    );
    partitionEntriesTest(
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
      [
        {
          "A": true,
          "C": 5,
          "": false,
        },
        {
          "b": "foo",
          "d": -2,
        },
      ],
    );
  },
});
