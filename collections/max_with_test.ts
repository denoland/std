// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { maxWith } from "./max_with.ts";

function maxWithTest<T>(
  input: [T[], (a: T, b: T) => number],
  expected: T | undefined,
  message?: string,
) {
  const actual = maxWith(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "maxWith() handles no mutation",
  fn() {
    const input = [[1, 3], [6, 1, 3], [4]];
    maxWith(input, (a, b) => a.length - b.length);

    assertEquals(input, [[1, 3], [6, 1, 3], [4]]);
  },
});

Deno.test({
  name: "maxWith() handles empty input",
  fn() {
    maxWithTest<string>([[], (a, b) => a.length - b.length], undefined);
  },
});

Deno.test({
  name: "maxWith() handles array of arrays",
  fn() {
    maxWithTest([[[1, 3], [6, 1, 3], [4]], (a, b) => a.length - b.length], [
      6,
      1,
      3,
    ]);
  },
});

Deno.test({
  name: "maxWith() handles array of strings",
  fn() {
    maxWithTest(
      [["Kim", "Anna", "Arthur"], (a, b) => a.length - b.length],
      "Arthur",
    );
  },
});

Deno.test({
  name: "maxWith() handles array of objects",
  fn() {
    maxWithTest(
      [
        [
          { name: "Kim", age: 24 },
          { name: "Anna", age: 20 },
          { name: "John", age: 43 },
        ],
        (a, b) => a.age - b.age,
      ],
      { name: "John", age: 43 },
    );
  },
});

Deno.test({
  name: "maxWith() handles duplicates",
  fn() {
    maxWithTest(
      [["John", "Arthur", "Arthur"], (a, b) => a.length - b.length],
      "Arthur",
    );
  },
});

Deno.test({
  name: "maxWith() handles array containing undefined",
  fn() {
    maxWithTest(
      [
        [undefined, undefined, 1],
        (a, b) => {
          if (a === undefined) {
            return 1;
          }
          if (b === undefined) {
            return -1;
          }
          return 0;
        },
      ],
      undefined,
    );
  },
});
