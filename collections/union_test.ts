// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { union } from "./union.ts";

function unionTest<I>(
  input: Array<Array<I>>,
  expected: Array<I>,
  message?: string,
) {
  const actual = union(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "union() handles no mutations",
  fn() {
    const arrayA = [1, 2, 3];
    const arrayB = [2, 4, 5];
    union(arrayA, arrayB);

    assertEquals(arrayA, [1, 2, 3]);
    assertEquals(arrayB, [2, 4, 5]);
  },
});

Deno.test({
  name: "union() handles empty input",
  fn() {
    unionTest([], []);
  },
});

Deno.test({
  name: "union() handles empty arrays",
  fn() {
    unionTest(
      [
        [],
        [],
        [],
      ],
      [],
    );
  },
});

Deno.test({
  name: "union() handles one input",
  fn() {
    unionTest(
      [
        [true, false],
      ],
      [true, false],
    );
    unionTest(
      [
        ["foo", "bar", "bar"],
      ],
      ["foo", "bar"],
    );
  },
});

Deno.test({
  name: "union() handles some empty",
  fn() {
    unionTest([[], ["a", "b", "c"]], ["a", "b", "c"]);
    unionTest([["a", "b", "c"], []], ["a", "b", "c"]);
    unionTest([[], ["a", "b", "c"], [], ["b", "d"]], ["a", "b", "c", "d"]);
  },
});

Deno.test({
  name: "union() handles distinct sets",
  fn() {
    unionTest([["a", "b", "c"], ["d", "e", "f"]], [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
    unionTest(
      [
        ["a", "b", "c"],
        ["d", "e", "f"],
        ["g", "h", "j"],
      ],
      [
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "j",
      ],
    );
  },
});

Deno.test({
  name: "union() handles overlapping sets",
  fn() {
    unionTest([["a", "b"], ["b", "c"]], ["a", "b", "c"]);
    unionTest(
      [
        [10, -2],
        [-2],
        [5, 10],
      ],
      [10, -2, 5],
    );
  },
});

Deno.test({
  name: "union() handles objects",
  fn() {
    const a = { foo: "bar" };
    const b = { bar: "baz" };
    const c = { fruit: "banana" };
    const d = { bar: "banana" };
    unionTest<Record<string, string>>([
      [a, b],
      [c],
    ], [a, b, c]);
    unionTest<Record<string, string>>([
      [a, b],
      [b],
    ], [a, b]);
    unionTest<Record<string, string>>([
      [a, b],
      [d],
    ], [a, b, d]);
    unionTest<Record<string, string>>([
      [a],
      [b, d],
      [c, a, b],
    ], [a, b, d, c]);
  },
});

Deno.test({
  name: "union() handles functions",
  fn() {
    const a = () => {};
    const b = () => null;
    const c = () => NaN;
    const d = (a: number, b: number) => a + b;
    const e = (a: number, b: number) => a - b;

    unionTest([
      [a, b],
      [c],
    ], [a, b, c]);
    unionTest([
      [a, b],
      [a],
    ], [a, b]);
    unionTest([
      [d, a],
      [e],
    ], [d, a, e]);
  },
});
