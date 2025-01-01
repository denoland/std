// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { intersect } from "./unstable_intersect.ts";

Deno.test("(unstable) intersect() handles no mutation", () => {
  const arrayA = [1, 2, 3];
  const arrayB = [3, 4, 5];
  intersect(arrayA, arrayB);
  assertEquals(arrayA, [1, 2, 3]);
  assertEquals(arrayB, [3, 4, 5]);
});

Deno.test("(unstable) intersect() handles empty input", () => {
  const actual = intersect();
  assertEquals(actual, []);
});

Deno.test("(unstable) intersect() handles empty arrays", () => {
  const actual = intersect([], []);
  assertEquals(actual, []);
});

Deno.test("(unstable) intersect() handles one side empty", () => {
  const firstEmpty = intersect([], [1, 2, 3]);
  const secondEmpty = intersect([1, 2, 3], []);
  assertEquals(firstEmpty, []);
  assertEquals(secondEmpty, []);
});

Deno.test("(unstable) intersect() handles empty result", () => {
  const actual = intersect(["a", "b", "c"], ["d", "e", "f"]);
  assertEquals(actual, []);
});

Deno.test("(unstable) intersect() handles one or more items in intersection", () => {
  const one = intersect(["a", "b"], ["b", "c"]);
  const orMore = intersect(["a", "b", "c", "d"], ["c", "d", "e", "f"]);
  assertEquals(one, ["b"]);
  assertEquals(orMore, ["c", "d"]);
});

Deno.test("(unstable) intersect() handles duplicates", () => {
  const duplicates = intersect(["a", "b", "c", "b"], ["b", "c"]);
  const moreDuplicates = intersect(["a", "b"], ["b", "b", "c", "c"]);
  assertEquals(duplicates, ["b", "c"]);
  assertEquals(moreDuplicates, ["b"]);
});

Deno.test("(unstable) intersect() handles more than two inputs", () => {
  assertEquals(
    intersect(
      ["a", "b"],
      ["b", "c"],
      ["s", "b"],
      ["b", "b"],
    ),
    ["b"],
  );
  assertEquals(
    intersect(
      [1],
      [1],
      [2],
    ),
    [],
  );

  assertEquals(
    intersect(
      [true, false],
      [true, false],
      [true],
    ),
    [true],
  );
});

Deno.test("(unstable) intersect() handles objects", () => {
  assertEquals(
    intersect<Record<string, string>>(
      [{ foo: "bar" }, { bar: "baz" }],
      [{ fruit: "banana" }],
    ),
    [],
  );

  const obj = { bar: "baz" };
  assertEquals(
    intersect<Record<string, string>>(
      [{ foo: "bar" }, obj],
      [obj],
    ),
    [obj],
  );

  assertEquals(
    intersect<Record<string, string>>(
      [{ foo: "bar" }, { bar: "baz" }],
      [{ bar: "banana" }],
    ),
    [],
  );
});

Deno.test("(unstable) intersect() handles functions", () => {
  assertEquals(
    intersect(
      [() => {}, () => null],
      [() => NaN],
    ),
    [],
  );

  const emptyObjectFunction = () => {};
  assertEquals(
    intersect(
      [emptyObjectFunction, () => null],
      [emptyObjectFunction],
    ),
    [emptyObjectFunction],
  );
  assertEquals(
    intersect(
      [(a: number, b: number) => a + b, () => null],
      [(a: number, b: number) => a - b],
    ),
    [],
  );
});

// If you are using sets using {@linkcode Set.prototype.intersection} directly is more efficient.
Deno.test("(unstable) intersect() handles sets", () => {
  const a = new Set([1, 2, 3, 4]);
  const b = new Set([2, 3]);
  assertEquals(intersect(a, b), [2, 3]);
});

Deno.test("(unstable) intersect() handles iterables of different types", () => {
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

Deno.test("(unstable) intersect() handles iterables with no mutation", () => {
  const a = [1, 2, 3, 4];
  const b = new Set([2, 3]);
  intersect(a, b);
  assertEquals(a, [1, 2, 3, 4]);
  assert(b.has(2));
  assert(b.has(3));
});

Deno.test("(unstable) intersect() handles generators", () => {
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
