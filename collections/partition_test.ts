// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { partition } from "./partition.ts";
import * as unstable from "./unstable_partition.ts";

function partitionTest<I>(
  input: [Array<I>, (element: I) => boolean],
  expected: [Array<I>, Array<I>],
  message?: string,
) {
  const actual = partition(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "partition() handles no mutation",
  fn() {
    const array = [1, 2, 3];
    partition(array, (it) => it % 2 === 0);

    assertEquals(array, [1, 2, 3]);
  },
});

Deno.test({
  name: "partition() handles empty input",
  fn() {
    partitionTest(
      [[], () => true],
      [[], []],
    );
  },
});

Deno.test({
  name: "partition() handles all match",
  fn() {
    partitionTest(
      [[2, 4, 6], (it) => it % 2 === 0],
      [[2, 4, 6], []],
    );
    partitionTest(
      [["foo", "bar"], (it) => it.length > 0],
      [["foo", "bar"], []],
    );
  },
});

Deno.test({
  name: "partition() handles none match",
  fn() {
    partitionTest(
      [[3, 7, 5], (it) => it % 2 === 0],
      [[], [3, 7, 5]],
    );
    partitionTest(
      [["foo", "bar"], (it) => it.startsWith("z")],
      [[], ["foo", "bar"]],
    );
  },
});

Deno.test({
  name: "partition() handles some match",
  fn() {
    partitionTest(
      [[13, 4, 13, 8], (it) => it % 2 === 0],
      [[4, 8], [13, 13]],
    );
    partitionTest(
      [["foo", "bar", ""], (it) => it.length > 0],
      [["foo", "bar"], [""]],
    );
  },
});

Deno.test({
  name: "partition() handles type guard predicates",
  fn() {
    const mixed: (string | number)[] = [1, "a", 2, "b"];
    const isString = (x: string | number): x is string => typeof x === "string";
    const [strings, numbers] = partition(mixed, isString);

    assertEquals(strings, ["a", "b"]);
    assertEquals(numbers, [1, 2]);
  },
});

Deno.test({
  name: "partition() handles generators",
  fn() {
    function* gen() {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
    }
    const [even, odd] = partition(gen(), (x) => x % 2 === 0);

    assertEquals(even, [2, 4]);
    assertEquals(odd, [1, 3]);
  },
});

Deno.test({
  name: "partition() handles Sets",
  fn() {
    const set = new Set([1, 2, 3, 4, 5]);
    const [even, odd] = partition(set, (x) => x % 2 === 0);

    assertEquals(even, [2, 4]);
    assertEquals(odd, [1, 3, 5]);
  },
});

Deno.test({
  name: "unstable.partition() passes index to predicate",
  fn() {
    const result = unstable.partition(
      [2, 4, 6],
      (_: number, index: number) => index % 2 === 0
    );
    assertEquals(result, [[2, 6], [4]]);
  },
});
