// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { zip } from "./zip.ts";

function zip1Test<T>(
  input: [Array<T>],
  expected: Array<[T]>,
  message?: string,
) {
  const actual = zip(...input);
  assertEquals(actual, expected, message);
}

assertEquals(zip([]), []);

Deno.test({
  name: "zip() handles one array",
  fn() {
    zip1Test([
      [1, 2, 3],
    ], [[1], [2], [3]]);
  },
});

function zipTest<T, U>(
  input: [ReadonlyArray<T>, ReadonlyArray<U>],
  expected: Array<[T, U]>,
  message?: string,
) {
  const actual = zip(...input);
  assertEquals(actual, expected, message);
}

function zip3Test<T, U, V>(
  input: [Array<T>, Array<U>, Array<V>],
  expected: Array<[T, U, V]>,
  message?: string,
) {
  const actual = zip(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "zip() handles three arrays",
  fn() {
    zip3Test([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ], [[1, 4, 7], [2, 5, 8], [3, 6, 9]]);
  },
});

Deno.test({
  name: "zip() handles three arrays when the first is the shortest",
  fn() {
    zip3Test([
      [1, 2],
      [4, 5, 6],
      [7, 8, 9],
    ], [[1, 4, 7], [2, 5, 8]]);
  },
});

Deno.test({
  name: "zip() handles no mutation",
  fn() {
    const arrayA = [1, 4, 5];
    const arrayB = ["foo", "bar"];
    zip(arrayA, arrayB);

    assertEquals(arrayA, [1, 4, 5]);
    assertEquals(arrayB, ["foo", "bar"]);
  },
});

Deno.test({
  name: "zip() handles empty input",
  fn() {
    zipTest(
      [[], []],
      [],
    );
    zipTest(
      [[1, 2, 3], []],
      [],
    );
    zipTest(
      [[], [{}, []]],
      [],
    );
    assertEquals(zip(), []);
  },
});

Deno.test({
  name: "zip() handles same length",
  fn() {
    zipTest(
      [
        [1, 4, 5],
        ["foo", "bar", "lorem"],
      ],
      [
        [1, "foo"],
        [4, "bar"],
        [5, "lorem"],
      ],
    );
    zipTest(
      [
        [2.2, false],
        ["test", true],
      ],
      [
        [2.2, "test"],
        [false, true],
      ],
    );
  },
});

Deno.test({
  name: "zip() handles first shorter",
  fn() {
    zipTest(
      [
        [1],
        ["foo", "bar", "lorem"],
      ],
      [[1, "foo"]],
    );
    zipTest(
      [
        [2.2, false],
        ["test", true, {}],
      ],
      [
        [2.2, "test"],
        [false, true],
      ],
    );
  },
});

Deno.test({
  name: "zip() handles second shorter",
  fn() {
    zipTest(
      [
        [1, 4, 5],
        ["foo"],
      ],
      [[1, "foo"]],
    );
    zipTest(
      [
        [2.2, false, "test"],
        ["test", true],
      ],
      [
        [2.2, "test"],
        [false, true],
      ],
    );
  },
});
