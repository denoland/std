// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { filterValues } from "./filter_values.ts";

function filterValuesTest<T>(
  input: [Record<string, T>, (value: T) => boolean],
  expected: Record<string, T>,
  message?: string,
) {
  const actual = filterValues(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "filterValues() handles no mutation",
  fn() {
    const object = { a: 5, b: true };
    filterValues(object, (it) => it !== 5);

    assertEquals(object, { a: 5, b: true });
  },
});

Deno.test({
  name: "filterValues() handles empty input",
  fn() {
    filterValuesTest(
      [{}, () => true],
      {},
    );
  },
});

Deno.test({
  name: "filterValues() handles identity",
  fn() {
    filterValuesTest(
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
  name: "filterValues() handles filters",
  fn() {
    filterValuesTest(
      [
        {
          "a5e4": { job: "Testing", error: true },
          "112d": { job: "Building", error: false },
          "0a1e": { job: "Approval", error: true },
        },
        (it) => it.error,
      ],
      {
        "a5e4": { job: "Testing", error: true },
        "0a1e": { job: "Approval", error: true },
      },
    );
    filterValuesTest(
      [
        {
          "todo": ["1023", "1024"],
          "dev": ["1010, 1040", "1001"],
          "done": ["1000"],
        },
        (it) => it.length > 1,
      ],
      {
        "todo": ["1023", "1024"],
        "dev": ["1010, 1040", "1001"],
      },
    );
  },
});
