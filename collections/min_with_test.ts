// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { minWith } from "./min_with.ts";

function minWithTest<T>(
  input: [T[], (a: T, b: T) => number],
  expected: T | undefined,
  message?: string,
) {
  const actual = minWith(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "minWith() handles no mutation",
  fn() {
    const input = [[1, 3], [6, 1, 3], [4]];
    minWith(input, (a, b) => a.length - b.length);

    assertEquals(input, [[1, 3], [6, 1, 3], [4]]);
  },
});

Deno.test({
  name: "minWith() handles empty input",
  fn() {
    minWithTest<string>([[], (a, b) => a.length - b.length], undefined);
  },
});

Deno.test({
  name: "minWith() handles array of arrays",
  fn() {
    minWithTest([[[1, 3], [6, 1, 3], [4]], (a, b) => a.length - b.length], [4]);
  },
});

Deno.test({
  name: "minWith() handles array of strings",
  fn() {
    minWithTest(
      [["Kim", "Anna", "John"], (a, b) => a.length - b.length],
      "Kim",
    );
  },
});

Deno.test({
  name: "minWith() handles array of objects",
  fn() {
    minWithTest(
      [
        [
          { name: "Kim", age: 24 },
          { name: "Anna", age: 20 },
          { name: "John", age: 43 },
        ],
        (a, b) => a.age - b.age,
      ],
      { name: "Anna", age: 20 },
    );
  },
});

Deno.test({
  name: "minWith() handles duplicates",
  fn() {
    minWithTest([["John", "Kim", "Kim"], (a, b) => a.length - b.length], "Kim");
  },
});

Deno.test({
  name: "minWith() handles array containing undefined",
  fn() {
    minWithTest(
      [
        [undefined, undefined, 1],
        (a, b) => {
          if (a === undefined) {
            return -1;
          }
          if (b === undefined) {
            return 1;
          }
          return 0;
        },
      ],
      undefined,
    );
  },
});
