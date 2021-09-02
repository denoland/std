// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { slideWindow } from "./slide_window.ts";

function slideWindowTest<T>(
  input: [
    collection: T[],
    size: number,
    config?: { step?: number; partial?: boolean },
  ],
  expected: T[][],
  message?: string,
) {
  const actual = slideWindow(...input);
  assertEquals(actual, expected, message);
}

function slideWindowThrowsTest<T>(
  input: [
    collection: T[],
    size: number,
    config?: { step?: number; partial?: boolean },
  ],
  ErrorClass?: ErrorConstructor | undefined,
  msgIncludes?: string,
  msg?: string | undefined,
) {
  assertThrows(
    () => {
      slideWindow(...input);
    },
    ErrorClass,
    msgIncludes,
    msg,
  );
}

Deno.test({
  name: "[collections/slideWindow] no mutation",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    slideWindow(numbers, 3);
    assertEquals(numbers, [1, 2, 3, 4, 5]);
  },
});

Deno.test({
  name: "[collections/slideWindow] empty input",
  fn() {
    slideWindowTest([[], 3], []);
    slideWindowTest([[], 3, {}], []);
    slideWindowTest([[], 3, { step: 2 }], []);
    slideWindowTest([[], 3, { partial: true }], []);
    slideWindowTest([[], 3, { step: 2, partial: true }], []);
  },
});

Deno.test({
  name: "[collections/slideWindow] default option",
  fn() {
    slideWindowTest([[1, 2, 3, 4, 5], 5], [
      [1, 2, 3, 4, 5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 3], [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 1], [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/slideWindow] step option",
  fn() {
    slideWindowTest([[1, 2, 3, 4, 5], 5, { step: 2 }], [
      [1, 2, 3, 4, 5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 3, { step: 2 }], [
      [1, 2, 3],
      [3, 4, 5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 1, { step: 2 }], [
      [1],
      [3],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/slideWindow] partial option",
  fn() {
    slideWindowTest([[1, 2, 3, 4, 5], 5, { partial: true }], [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5],
      [3, 4, 5],
      [4, 5],
      [5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 3, { partial: true }], [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5],
      [5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 1, { partial: true }], [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/slideWindow] step and partial option",
  fn() {
    slideWindowTest([[1, 2, 3, 4, 5], 5, { step: 2, partial: true }], [
      [1, 2, 3, 4, 5],
      [3, 4, 5],
      [5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 3, { step: 2, partial: true }], [
      [1, 2, 3],
      [3, 4, 5],
      [5],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 1, { step: 2, partial: true }], [
      [1],
      [3],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/slideWindow] invalid size or step: other than number",
  fn() {
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], NaN],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: NaN }],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      // @ts-ignore: for test
      [[1, 2, 3, 4, 5], "invalid"],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      // @ts-ignore: for test
      [[1, 2, 3, 4, 5], 3, { step: "invalid" }],
      RangeError,
      "Both size and step must be positive integer.",
    );
  },
});

Deno.test({
  name: "[collections/slideWindow] invalid size or step: not integer number",
  fn() {
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 0.5],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: 0.5 }],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 1.5],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: 1.5 }],
      RangeError,
      "Both size and step must be positive integer.",
    );
  },
});

Deno.test({
  name: "[collections/slideWindow] invalid size or step: not positive number",
  fn() {
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 0],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: 0 }],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], -1],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: -1 }],
      RangeError,
      "Both size and step must be positive integer.",
    );
  },
});

Deno.test({
  name: "[collections/slideWindow] invalid size or step: infinity",
  fn() {
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], Number.NEGATIVE_INFINITY],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: Number.NEGATIVE_INFINITY }],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], Number.POSITIVE_INFINITY],
      RangeError,
      "Both size and step must be positive integer.",
    );
    slideWindowThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: Number.POSITIVE_INFINITY }],
      RangeError,
      "Both size and step must be positive integer.",
    );
  },
});

Deno.test({
  name: "[collections/slideWindow] large size",
  fn() {
    slideWindowTest([[1, 2, 3, 4, 5], 100], []);
    slideWindowTest([[1, 2, 3, 4, 5], 100, { step: 2 }], []);
    slideWindowTest([[1, 2, 3, 4, 5], 100, { step: 2, partial: true }], [
      [1, 2, 3, 4, 5],
      [3, 4, 5],
      [5],
    ]);
  },
});

Deno.test({
  name: "[collections/slideWindow] large step",
  fn() {
    slideWindowTest([[1, 2, 3, 4, 5], 3, { step: 100 }], [
      [1, 2, 3],
    ]);
    slideWindowTest([[1, 2, 3, 4, 5], 3, { step: 100, partial: true }], [
      [1, 2, 3],
    ]);
  },
});

Deno.test({
  name: "[collections/slideWindow] empty Array",
  fn() {
    slideWindowTest([Array(5), 5], [
      Array(5),
    ]);
    slideWindowTest([Array(5), 3], [
      Array(3),
      Array(3),
      Array(3),
    ]);
    slideWindowTest([Array(5), 1], [
      Array(1),
      Array(1),
      Array(1),
      Array(1),
      Array(1),
    ]);
  },
});
