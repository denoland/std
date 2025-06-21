// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { zip, type ZipOptions } from "./unstable_zip.ts";
import { assertType, type IsExact } from "@std/testing/types";

const EMPTY_OPTIONS: ZipOptions = {};

Deno.test({
  name: "zip() handles zero arrays",
  fn() {
    assertEquals(zip([]), []);
    assertEquals(zip(EMPTY_OPTIONS, []), []);
  },
});

Deno.test({
  name: "zip() handles one array",
  fn() {
    assertEquals(zip([1, 2, 3]), [[1], [2], [3]]);
    assertEquals(zip(EMPTY_OPTIONS, [1, 2, 3]), [[1], [2], [3]]);
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

Deno.test("zip() handles truncate option", async (t) => {
  const arrays: [number[], string[], bigint[]] = [[1, 2, 3], [
    "a",
    "b",
    "c",
    "d",
  ], [88n]];

  await t.step('truncate: "shortest" (default)', () => {
    const explicit = zip({ truncate: "shortest" }, ...arrays);
    const implicit = zip(...arrays);

    assertEquals(explicit, [[1, "a", 88n]]);
    assertEquals(explicit, implicit);

    assertType<IsExact<typeof explicit, [number, string, bigint][]>>(true);
    assertType<IsExact<typeof implicit, [number, string, bigint][]>>(true);
  });

  await t.step('truncate: "longest"', () => {
    const zipped = zip({ truncate: "longest" }, ...arrays);
    assertEquals(
      zipped,
      [
        [1, "a", 88n],
        [2, "b", undefined],
        [3, "c", undefined],
        [undefined, "d", undefined],
      ],
    );

    assertType<
      IsExact<
        typeof zipped,
        [number | undefined, string | undefined, bigint | undefined][]
      >
    >(true);
  });
});
