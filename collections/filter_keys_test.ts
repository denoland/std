// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { filterKeys } from "./filter_keys.ts";

function filterKeysTest<T>(
  input: [Record<string, T>, (key: string) => boolean],
  expected: Record<string, T>,
  message?: string,
) {
  const actual = filterKeys(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "filterKeys() handles no mutation",
  fn() {
    const object = { a: 5, b: true };
    filterKeys(object, (key) => key !== "a");

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "filterKeys() handles empty input",
  fn() {
    filterKeysTest(
      [{}, () => true],
      {},
    );
  },
});

Deno.test({
  name: "filterKeys() handles identity",
  fn() {
    filterKeysTest(
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
  name: "filterKeys() handles filters",
  fn() {
    filterKeysTest(
      [
        {
          foo: true,
          bar: "lorem",
          baz: 13,
          1: -5,
        },
        (it) => it.startsWith("b"),
      ],
      {
        bar: "lorem",
        baz: 13,
      },
    );
    filterKeysTest(
      [
        {
          "Kim": 22,
          "Andrew": 14,
          "Marija": 34,
        },
        (it) => it.length > 3,
      ],
      {
        "Andrew": 14,
        "Marija": 34,
      },
    );
  },
});
