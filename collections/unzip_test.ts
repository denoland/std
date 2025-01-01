// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { unzip } from "./unzip.ts";

function unzipTest<T, U>(
  input: [Array<[T, U]>],
  expected: [Array<T>, Array<U>],
  message?: string,
) {
  const actual = unzip(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "unzip() handles no mutation",
  fn() {
    const zipped: Array<[number, boolean]> = [
      [1, true],
      [2, false],
      [3, true],
    ];
    unzip(zipped);

    assertEquals(zipped, [
      [1, true],
      [2, false],
      [3, true],
    ]);
  },
});

Deno.test({
  name: "unzip() handles empty input",
  fn() {
    unzipTest(
      [[]],
      [[], []],
    );
  },
});

Deno.test({
  name: "unzip() handles unzips",
  fn() {
    unzipTest(
      [
        [
          [1, "foo"],
          [4, "bar"],
          [5, "lorem"],
        ],
      ],
      [
        [1, 4, 5],
        ["foo", "bar", "lorem"],
      ],
    );
    unzipTest(
      [
        [
          [true, false],
        ],
      ],
      [
        [true],
        [false],
      ],
    );
    unzipTest(
      [
        [
          [undefined, "foo"],
          [5, null],
          [undefined, "asdf"],
          [null, false],
          [1.2, ""],
        ],
      ],
      [
        [undefined, 5, undefined, null, 1.2],
        ["foo", null, "asdf", false, ""],
      ],
    );
  },
});
