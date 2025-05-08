// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { intersect } from "./intersect.ts";

function intersectTest<I>(
  input: Array<Array<I>>,
  expected: Array<I>,
  message?: string,
) {
  const actual = intersect(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "intersect() handles no mutation",
  fn() {
    const arrayA = [1, 2, 3];
    const arrayB = [3, 4, 5];
    intersect(arrayA, arrayB);

    assertEquals(arrayA, [1, 2, 3]);
    assertEquals(arrayB, [3, 4, 5]);
  },
});

Deno.test({
  name: "intersect() handles empty input",
  fn() {
    const actual = intersect();
    assertEquals(actual, []);
  },
});

Deno.test({
  name: "intersect() handles empty arrays",
  fn() {
    const actual = intersect([], []);
    assertEquals(actual, []);
  },
});

Deno.test({
  name: "intersect() handles one side empty",
  fn() {
    intersectTest([[], ["a", "b", "c"]], []);
    intersectTest([["a", "b", "c"], []], []);
  },
});

Deno.test({
  name: "intersect() handles empty result",
  fn() {
    intersectTest([["a", "b", "c"], ["d", "e", "f"]], []);
  },
});

Deno.test({
  name: "intersect() handles one or more items in intersection",
  fn() {
    intersectTest([["a", "b"], ["b", "c"]], ["b"]);
    intersectTest([["a", "b", "c", "d"], ["c", "d", "e", "f"]], ["c", "d"]);
  },
});

Deno.test({
  name: "intersect() handles duplicates",
  fn() {
    intersectTest([["a", "b", "c", "b"], ["b", "c"]], ["b", "c"]);
    intersectTest([["a", "b"], ["b", "b", "c", "c"]], ["b"]);
  },
});

Deno.test({
  name: "intersect() handles more than two inputs",
  fn() {
    intersectTest(
      [
        ["a", "b"],
        ["b", "c"],
        ["s", "b"],
        ["b", "b"],
      ],
      ["b"],
    );
    intersectTest(
      [
        [1],
        [1],
        [2],
      ],
      [],
    );
    intersectTest(
      [
        [true, false],
        [true, false],
        [true],
      ],
      [true],
    );
  },
});

Deno.test({
  name: "intersect() handles objects",
  fn() {
    intersectTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ fruit: "banana" }],
    ], []);

    const obj = { bar: "baz" };
    intersectTest<Record<string, string>>([
      [{ foo: "bar" }, obj],
      [obj],
    ], [obj]);
    intersectTest<Record<string, string>>([
      [{ foo: "bar" }, { bar: "baz" }],
      [{ bar: "banana" }],
    ], []);
  },
});

Deno.test({
  name: "intersect() handles functions",
  fn() {
    intersectTest([
      [() => {}, () => null],
      [() => NaN],
    ], []);

    const emptyObjectFunction = () => {};
    intersectTest([
      [emptyObjectFunction, () => null],
      [emptyObjectFunction],
    ], [emptyObjectFunction]);
    intersectTest([
      [(a: number, b: number) => a + b, () => null],
      [(a: number, b: number) => a - b],
    ], []);
  },
});

// If you are using sets using {@linkcode Set.prototype.intersection} directly is more efficient.
Deno.test("intersect() handles sets", () => {
  const a = new Set([1, 2, 3, 4]);
  const b = new Set([2, 3]);
  assertEquals(intersect(a, b), [2, 3]);
});

Deno.test("intersect() handles iterables of different types", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const set = new Set([1, 2, 3, 4, 5]);
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const iterable = {
    *[Symbol.iterator]() {
      yield 3;
      yield 6;
    },
  };
  assertEquals(intersect(arr, set, gen(), iterable), [3]);
});

Deno.test("intersect() handles iterables with no mutation", () => {
  const a = [1, 2, 3, 4];
  const b = new Set([2, 3]);
  intersect(a, b);
  assertEquals(a, [1, 2, 3, 4]);
  assert(b.has(2));
  assert(b.has(3));
});

Deno.test("intersect() handles generators", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
  }
  function* gen2() {
    yield 2;
    yield 3;
  }
  assertEquals(intersect(gen(), gen2()), [2, 3]);
});
