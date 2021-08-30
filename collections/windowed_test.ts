// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { windowed } from "./windowed.ts";

function windowedTest<T>(
  input: [
    collection: T[],
    size: number,
    config?: { step?: number; partial?: boolean },
  ],
  expected: T[][],
  message?: string,
) {
  const actual = windowed(...input);
  assertEquals(actual, expected, message);
}

Deno.test({
  name: "[collections/windowed] no mutation",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    windowed(numbers, 3);
    assertEquals(numbers, [1, 2, 3, 4, 5]);
  },
});

Deno.test({
  name: "[collections/windowed] empty input",
  fn() {
    windowedTest([[], 3], []);
    windowedTest([[], 3, {}], []);
    windowedTest([[], 3, { step: 2 }], []);
    windowedTest([[], 3, { partial: true }], []);
    windowedTest([[], 3, { step: 2, partial: true }], []);
  },
});

Deno.test({
  name: "[collections/windowed] default option",
  fn() {
    windowedTest([[1, 2, 3, 4, 5], 5], [
      [1, 2, 3, 4, 5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 3], [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 1], [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/windowed] step was set",
  fn() {
    windowedTest([[1, 2, 3, 4, 5], 5, { step: 2 }], [
      [1, 2, 3, 4, 5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 3, { step: 2 }], [
      [1, 2, 3],
      [3, 4, 5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 1, { step: 2 }], [
      [1],
      [3],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/windowed] partial was set",
  fn() {
    windowedTest([[1, 2, 3, 4, 5], 5, { partial: true }], [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5],
      [3, 4, 5],
      [4, 5],
      [5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 3, { partial: true }], [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5],
      [5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 1, { partial: true }], [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/windowed] step and partial was set",
  fn() {
    windowedTest([[1, 2, 3, 4, 5], 5, { step: 2, partial: true }], [
      [1, 2, 3, 4, 5],
      [3, 4, 5],
      [5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 3, { step: 2, partial: true }], [
      [1, 2, 3],
      [3, 4, 5],
      [5],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 1, { step: 2, partial: true }], [
      [1],
      [3],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/windowed] size or step was invalid",
  fn() {
    assertThrows(
      () => {
        windowed([1, 2, 3, 4, 5], 0);
      },
      RangeError,
      "Both size and step must be positive.",
    );
    assertThrows(
      () => {
        windowed([1, 2, 3, 4, 5], 3, { step: 0 });
      },
      RangeError,
      "Both size and step must be positive.",
    );
    assertThrows(
      () => {
        windowed([1, 2, 3, 4, 5], NaN);
      },
      RangeError,
      "Both size and step must be positive.",
    );
    assertThrows(
      () => {
        windowed([1, 2, 3, 4, 5], 3, { step: NaN });
      },
      RangeError,
      "Both size and step must be positive.",
    );
    assertThrows(
      () => {
        // @ts-ignore: for test
        windowed([1, 2, 3, 4, 5], "invalid");
      },
      RangeError,
      "Both size and step must be positive.",
    );
    assertThrows(
      () => {
        // @ts-ignore: for test
        windowed([1, 2, 3, 4, 5], 3, { step: "invalid" });
      },
      RangeError,
      "Both size and step must be positive.",
    );
  },
});

Deno.test({
  name: "[collections/windowed] large size",
  fn() {
    windowedTest([[1, 2, 3, 4, 5], 100, { step: 2 }], []);
    windowedTest([[1, 2, 3, 4, 5], 100, { step: 2, partial: true }], [
      [1, 2, 3, 4, 5],
      [3, 4, 5],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/windowed] large step",
  fn() {
    windowedTest([[1, 2, 3, 4, 5], 3, { step: 100 }], [
      [1, 2, 3],
    ]);
    windowedTest([[1, 2, 3, 4, 5], 3, { step: 100, partial: true }], [
      [1, 2, 3],
    ]);
  },
});

Deno.test({
  name: "[collections/windowed] empty Array",
  fn() {
    windowedTest([Array(5), 5], [
      Array(5),
    ]);
    windowedTest([Array(5), 3], [
      Array(3),
      Array(3),
      Array(3),
    ]);
    windowedTest([Array(5), 1], [
      Array(1),
      Array(1),
      Array(1),
      Array(1),
      Array(1),
    ]);
  },
});
