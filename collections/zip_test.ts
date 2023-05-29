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
      // align length to shortest array
      const zipped = zip([0, "a"], [1, "b", "x"]);
      type _ = AssertTrue<IsExact<typeof zipped, [[0, 1], ["a", "b"]]>>;
      assertEquals(zipped, [[0, 1], ["a", "b"]]);
    }
    {
      // align length to shortest array
      const zipped = zip([0, "a"], [1, "b", "x"], [2]);
      type _ = AssertTrue<IsExact<typeof zipped, [[0, 1, 2]]>>;
      assertEquals(zipped, [[0, 1, 2]]);
    }
    {
      // empty tuple
      const zipped = zip([], [], []);
      type _ = AssertTrue<IsExact<typeof zipped, []>>;
      assertEquals(zipped, []);
    }
    {
      // empty
      const zipped = zip();
      type _ = AssertTrue<IsExact<typeof zipped, []>>;
      assertEquals(zipped, []);
    }
    {
      // array (number[] and string[])
      const zipped = zip([0, 1] as number[], ["a", "b"] as string[]);
      type _ = AssertTrue<IsExact<typeof zipped, [number, string][]>>;
    }
    {
      // array (readonly number[] and readonly string[])
      const zipped = zip(
        [0, 1] as readonly number[],
        ["a", "b"] as readonly string[],
      );
      type _ = AssertTrue<IsExact<typeof zipped, [number, string][]>>;
    }
    {
      // array + tuple ([0, 1, 2] and string[])
      const zipped = zip([0, 1], ["a", "b"] as readonly string[]);
      // Note: In this case the length of the second argument cannot be inferred from the type.
      // Possible return types are `[[0, string], [1, string]]`, `[[0, string]]`, and [].
      type _ = AssertTrue<
        IsExact<
          typeof zipped,
          | [[0, string], [1, string]]
          | [[0, string]]
          | []
        >
      >;
    }
    {
      // array + tuple (readonly number[] and ["a", "b"])
      const zipped = zip([0, 1] as readonly number[], ["a", "b"]);
      // Note: In this case the length of the second argument cannot be inferred from the type.
      // Possible return types are `[[0, string], [1, string]]`, `[[0, string]]`, and [].
      type _ = AssertTrue<
        IsExact<
          typeof zipped,
          | [[number, "a"], [number, "b"]]
          | [[number, "a"]]
          | []
        >
      >;
    }
    {
      // [number, string][] -> [number[], string[]]
      const target: readonly (readonly [number, string])[] = [
        [0, "a"],
        [2, "b"],
        [3, "c"],
      ];
      const zipped = zip(...target);
      type _ = AssertTrue<IsExact<typeof zipped, [number[], string[]]>>;
    }
    {
      // number[][] -> number[][]
      const target: readonly (readonly number[])[] = [[0, 1], [2, 3]];
      const zipped = zip(...target);
      type _ = AssertTrue<IsExact<typeof zipped, number[][]>>;
    }
    {
      // The length cannot be determined because it is a union type
      const target: [
        [0, 1] | [10, 11, 12, 13, 14],
        ["a", "b", "c"] | ["m", "n", "o", "p"],
      ] = [[0, 1], ["a", "b", "c"]];
      const zipped = zip(...target);

      // In this case, the length of the return value can be 2, 3 or 4.
      // However, it is difficult to express it perfectly from type information.
      // For return values, we try to set the type where possible.
      // The types below are not entirely ideal, but should cover most use cases.
      type _1 = AssertTrue<IsExact<typeof zipped[0], [0 | 10, "a" | "m"]>>;
      type _2 = AssertTrue<IsExact<typeof zipped[1], [1 | 11, "b" | "n"]>>;
      type _3 = AssertTrue<
        IsExact<typeof zipped[2], [12 | undefined, "c" | "o"] | undefined>
      >;
      type _4 = AssertTrue<
        IsExact<typeof zipped[3], [13 | undefined, "p" | undefined] | undefined>
      >;
      type _5 = AssertTrue<
        IsExact<typeof zipped[4], [14 | undefined, never] | undefined>
      >;
      // @ts-expect-error: length less than 5
      zipped[5];
    }
    {
      // The length cannot be determined because it is a union type
      const target: [
        boolean[],
        [0, 1] | [10, 11, 12, 13, 14],
        ["a", "b", "c"] | ["m", "n", "o", "p"],
      ] = [[], [0, 1], ["a", "b", "c"]];
      const zipped = zip(...target);

      // In this case, the length of the return value can be 2, 3 or 4.
      // However, it is difficult to express it perfectly from type information.
      // For return values, we try to set the type where possible.
      // The types below are not entirely ideal, but should cover most use cases.
      type _1 = AssertTrue<
        IsExact<typeof zipped[0], [boolean, 0 | 10, "a" | "m"] | undefined>
      >;
      type _2 = AssertTrue<
        IsExact<typeof zipped[1], [boolean, 1 | 11, "b" | "n"] | undefined>
      >;
      type _3 = AssertTrue<
        IsExact<
          typeof zipped[2],
          [boolean, 12 | undefined, "c" | "o"] | undefined
        >
      >;
      type _4 = AssertTrue<
        IsExact<
          typeof zipped[3],
          [boolean, 13 | undefined, "p" | undefined] | undefined
        >
      >;
      type _5 = AssertTrue<
        IsExact<typeof zipped[4], [boolean, 14 | undefined, never] | undefined>
      >;
      // @ts-expect-error: length less than 5
      zipped[5];
    }
    {
      // invalid parameter
      // @ts-expect-error: for test
      const _0 = zip("invalid");
      // @ts-expect-error: for test
      const _1 = zip(99999);
      // @ts-expect-error: for test
      const _2 = zip({});
    }
  },
});
