// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { AssertTrue, IsExact } from "../testing/types.ts";
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
  name: "[collections/zip] Correctly zips one array",
  fn() {
    zip1Test([
      [1, 2, 3],
    ], [[1], [2], [3]]);
  },
});

function zipTest<T, U>(
  input: [Array<T>, Array<U>],
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
  name: "[collections/zip] Correctly zips three arrays",
  fn() {
    zip3Test([
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ], [[1, 4, 7], [2, 5, 8], [3, 6, 9]]);
  },
});

Deno.test({
  name:
    "[collections/zip] Correctly zips three arrays when the first is the shortest",
  fn() {
    zip3Test([
      [1, 2],
      [4, 5, 6],
      [7, 8, 9],
    ], [[1, 4, 7], [2, 5, 8]]);
  },
});

Deno.test({
  name: "[collections/zip] no mutation",
  fn() {
    const arrayA = [1, 4, 5];
    const arrayB = ["foo", "bar"];
    zip(arrayA, arrayB);

    assertEquals(arrayA, [1, 4, 5]);
    assertEquals(arrayB, ["foo", "bar"]);
  },
});

Deno.test({
  name: "[collections/zip] empty input",
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
  name: "[collections/zip] same length",
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
  name: "[collections/zip] first shorter",
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
  name: "[collections/zip] second shorter",
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

Deno.test({
  name: "[collections/zip] typing",
  fn() {
    {
      const zipped = zip([0], [1]);
      type _ = AssertTrue<IsExact<typeof zipped, [[0, 1]]>>;
      assertEquals(zipped, [[0, 1]]);
    }
    {
      const zipped = zip([0, "a"], [1, "b"]);
      type _ = AssertTrue<IsExact<typeof zipped, [[0, 1], ["a", "b"]]>>;
      assertEquals(zipped, [[0, 1], ["a", "b"]]);
    }
    {
      const zipped = zip([0, "a"], [1, "b", "x"]);
      type _ = AssertTrue<IsExact<typeof zipped, [[0, 1], ["a", "b"]]>>;
      assertEquals(zipped, [[0, 1], ["a", "b"]]);
    }
    {
      const zipped = zip([0, "a"], [1, "b", "x"], [2]);
      type _ = AssertTrue<IsExact<typeof zipped, [[0, 1, 2]]>>;
      assertEquals(zipped, [[0, 1, 2]]);
    }
    {
      const zipped = zip([], [], []);
      type _ = AssertTrue<IsExact<typeof zipped, []>>;
      assertEquals(zipped, []);
    }
    {
      const zipped = zip();
      type _ = AssertTrue<IsExact<typeof zipped, []>>;
      assertEquals(zipped, []);
    }
  },
});
