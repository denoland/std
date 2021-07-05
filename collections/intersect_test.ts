// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "https://deno.land/std@0.100.0/testing/asserts.ts";
import { intersect } from "./intersect.ts";

function intersectTest<I>(
  input: [Array<I>, Array<I>],
  expected: Array<I>,
  message?: string,
) {
  const actual = intersect(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/intersect] empty arrays",
  fn() {
    intersectTest([[], []], []);
  },
});

Deno.test({
  name: "[collections/intersect] one side empty",
  fn() {
    intersectTest([[], ["a", "b", "c"]], []);
    intersectTest([["a", "b", "c"], []], []);
  },
});

Deno.test({
  name: "[collections/intersect] empty result",
  fn() {
    intersectTest([["a", "b", "c"], ["d", "e", "f"]], []);
  },
});

Deno.test({
  name: "[collections/intersect] one or more items in intersection",
  fn() {
    intersectTest([["a", "b"], ["b", "c"]], ["b"]);
    intersectTest([["a", "b", "c", "d"], ["c", "d", "e", "f"]], ["c", "d"]);
  },
});

Deno.test({
  name: "[collections/intersect] objects",
  fn() {
    intersectTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ fruit: "banana" }],
    ], []);
    intersectTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ bar: "baz" }],
    ], [{ bar: "baz" }]);
    intersectTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ bar: "banana" }],
    ], []);
  },
});

Deno.test({
  name: "[collections/intersect] functions",
  fn() {
    intersectTest([
      [() => {}, () => null],
      [() => NaN],
    ], []);
    intersectTest([
      [() => {}, () => null],
      [() => {}],
    ], [() => {}]);
    intersectTest([
      [(a: number, b: number) => a + b, () => null],
      [(a: number, b: number) => a - b],
    ], []);
  },
});
