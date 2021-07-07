// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { union } from "./union.ts";

function unionTest<I>(
  input: [Array<I>, Array<I>],
  expected: Array<I>,
  message?: string,
) {
  const actual = union(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/union] empty arrays",
  fn() {
    unionTest([[], []], []);
  },
});

Deno.test({
  name: "[collections/union] one side empty",
  fn() {
    unionTest([[], ["a", "b", "c"]], ["a", "b", "c"]);
    unionTest([["a", "b", "c"], []], ["a", "b", "c"]);
  },
});

Deno.test({
  name: "[collections/union] distinct sets",
  fn() {
    unionTest([["a", "b", "c"], ["d", "e", "f"]], [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  },
});

Deno.test({
  name: "[collections/union] overlapping sets",
  fn() {
    unionTest([["a", "b"], ["b", "c"]], ["a", "b", "c"]);
    unionTest([["a", "b", "c", "d"], ["c", "d", "e", "f"]], [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
    ]);
  },
});

Deno.test({
  name: "[collections/union] objects",
  fn() {
    unionTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ fruit: "banana" }],
    ], [{ foo: "bar" }, { bar: "baz" }, { fruit: "banana" }]);
    unionTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ bar: "baz" }],
    ], [{ foo: "bar" }, { bar: "baz" }]);
    unionTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ bar: "banana" }],
    ], [{ foo: "bar" }, { bar: "baz" }, { bar: "banana" }]);
  },
});

Deno.test({
  name: "[collections/union] functions",
  fn() {
    unionTest([
      [() => {}, () => null],
      [() => NaN],
    ], [() => {}, () => null, () => NaN]);
    unionTest([
      [() => {}, () => null],
      [() => {}],
    ], [() => {}, () => null]);
    unionTest([
      [(a: number, b: number) => a + b, () => null],
      [(a: number, b: number) => a - b],
    ], [
      (a: number, b: number) => a + b,
      () => null,
      (a: number, b: number) => a - b,
    ]);
  },
});
