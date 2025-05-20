// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { slidingWindows } from "./sliding_windows.ts";

function slidingWindowsTest<T>(
  input: Parameters<typeof slidingWindows>,
  expected: T[][],
  message?: string,
) {
  const actual = slidingWindows(...input);
  assertEquals(actual, expected, message);
}
function slidingWindowsThrowsTest<T>(
  input: [
    collection: T[],
    size: number,
    config?: { step?: number; partial?: boolean },
  ],
  ErrorClass: ErrorConstructor,
  msgIncludes?: string,
  msg?: string | undefined,
) {
  assertThrows(
    () => {
      slidingWindows(...input);
    },
    ErrorClass,
    msgIncludes,
    msg,
  );
}

Deno.test({
  name: "slidingWindows() handles no mutation",
  fn() {
    const numbers = [1, 2, 3, 4, 5];
    slidingWindows(numbers, 3);
    assertEquals(numbers, [1, 2, 3, 4, 5]);
  },
});

Deno.test({
  name: "slidingWindows() handles empty input",
  fn() {
    slidingWindowsTest([[], 3], []);
    slidingWindowsTest([[], 3, {}], []);
    slidingWindowsTest([[], 3, { step: 2 }], []);
    slidingWindowsTest([[], 3, { partial: true }], []);
    slidingWindowsTest([[], 3, { step: 2, partial: true }], []);
  },
});

Deno.test({
  name: "slidingWindows() handles default option",
  fn() {
    slidingWindowsTest([[1, 2, 3, 4, 5], 5], [
      [1, 2, 3, 4, 5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 3], [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 1], [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  },
});

Deno.test({
  name: "slidingWindows() handles step option",
  fn() {
    slidingWindowsTest([[1, 2, 3, 4, 5], 5, { step: 2 }], [
      [1, 2, 3, 4, 5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 3, { step: 2 }], [
      [1, 2, 3],
      [3, 4, 5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 1, { step: 2 }], [
      [1],
      [3],
      [5],
    ]);
  },
});

Deno.test({
  name: "slidingWindows() handles partial option",
  fn() {
    slidingWindowsTest([[1, 2, 3, 4, 5], 5, { partial: true }], [
      [1, 2, 3, 4, 5],
      [2, 3, 4, 5],
      [3, 4, 5],
      [4, 5],
      [5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 3, { partial: true }], [
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
      [4, 5],
      [5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 1, { partial: true }], [
      [1],
      [2],
      [3],
      [4],
      [5],
    ]);
  },
});

Deno.test({
  name: "slidingWindows() handles step and partial option",
  fn() {
    slidingWindowsTest([[1, 2, 3, 4, 5], 5, { step: 2, partial: true }], [
      [1, 2, 3, 4, 5],
      [3, 4, 5],
      [5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 3, { step: 2, partial: true }], [
      [1, 2, 3],
      [3, 4, 5],
      [5],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 1, { step: 2, partial: true }], [
      [1],
      [3],
      [5],
    ]);
  },
});

Deno.test({
  name: "slidingWindows() handles invalid size or step: other than number",
  fn() {
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], NaN],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is NaN",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: NaN }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is NaN",
    );
    slidingWindowsThrowsTest(
      // @ts-ignore: for test
      [[1, 2, 3, 4, 5], "invalid"],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is invalid",
    );
    slidingWindowsThrowsTest(
      // @ts-ignore: for test
      [[1, 2, 3, 4, 5], 3, { step: "invalid" }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is invalid",
    );
  },
});

Deno.test({
  name: "slidingWindows() handles invalid size or step: not integer number",
  fn() {
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 0.5],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is 0.5",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: 0.5 }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is 0.5",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 1.5],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is 1.5",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: 1.5 }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is 1.5",
    );
  },
});

Deno.test({
  name: "slidingWindows() handles invalid size or step: not positive number",
  fn() {
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 0],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is 0",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: 0 }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is 0",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], -1],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is -1",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: -1 }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is -1",
    );
  },
});

Deno.test({
  name: "slidingWindows() handles invalid size or step: infinity",
  fn() {
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], Number.NEGATIVE_INFINITY],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is -Infinity",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: Number.NEGATIVE_INFINITY }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is -Infinity",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], Number.POSITIVE_INFINITY],
      RangeError,
      "Cannot create sliding windows: size must be a positive integer, current value is Infinity",
    );
    slidingWindowsThrowsTest(
      [[1, 2, 3, 4, 5], 3, { step: Number.POSITIVE_INFINITY }],
      RangeError,
      "Cannot create sliding windows: step must be a positive integer, current value is Infinity",
    );
  },
});

Deno.test({
  name: "slidingWindows() handles large size",
  fn() {
    slidingWindowsTest([[1, 2, 3, 4, 5], 100], []);
    slidingWindowsTest([[1, 2, 3, 4, 5], 100, { step: 2 }], []);
    slidingWindowsTest([[1, 2, 3, 4, 5], 100, { step: 2, partial: true }], [
      [1, 2, 3, 4, 5],
      [3, 4, 5],
      [5],
    ]);
  },
});

Deno.test({
  name: "slidingWindows() handles large step",
  fn() {
    slidingWindowsTest([[1, 2, 3, 4, 5], 3, { step: 100 }], [
      [1, 2, 3],
    ]);
    slidingWindowsTest([[1, 2, 3, 4, 5], 3, { step: 100, partial: true }], [
      [1, 2, 3],
    ]);
  },
});

Deno.test({
  name: "slidingWindows() handles empty Array",
  fn() {
    slidingWindowsTest([Array(5), 5], [
      Array(5),
    ]);
    slidingWindowsTest([Array(5), 3], [
      Array(3),
      Array(3),
      Array(3),
    ]);
    slidingWindowsTest([Array(5), 1], [
      Array(1),
      Array(1),
      Array(1),
      Array(1),
      Array(1),
    ]);
  },
});

Deno.test("slidingWindows() handles a generator", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
  }
  function* emptyGen() {}
  slidingWindowsTest([gen(), 5], [[1, 2, 3, 4, 5]]);
  slidingWindowsTest([gen(), 3], [[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
  slidingWindowsTest([gen(), 1], [[1], [2], [3], [4], [5]]);
  slidingWindowsTest([gen(), 3, { partial: true }], [
    [1, 2, 3],
    [2, 3, 4],
    [3, 4, 5],
    [4, 5],
    [5],
  ]);
  slidingWindowsTest([gen(), 3, { step: 2 }], [[1, 2, 3], [3, 4, 5]]);
  slidingWindowsTest([gen(), 1, { step: 2, partial: true }], [[1], [3], [5]]);

  slidingWindowsTest([emptyGen(), 3], []);
});

Deno.test("slidingWindows() handles a string", () => {
  const str = "12345";
  slidingWindowsTest([str, 5], [["1", "2", "3", "4", "5"]]);
  slidingWindowsTest([str, 3], [["1", "2", "3"], ["2", "3", "4"], [
    "3",
    "4",
    "5",
  ]]);
  slidingWindowsTest([str, 1], [["1"], ["2"], ["3"], ["4"], ["5"]]);
});

Deno.test("slidingWindows() handles a Set", () => {
  const set = new Set([1, 2, 3, 4, 5]);
  slidingWindowsTest([set, 5], [[1, 2, 3, 4, 5]]);
  slidingWindowsTest([set, 3], [[1, 2, 3], [2, 3, 4], [3, 4, 5]]);
  slidingWindowsTest([set, 1], [[1], [2], [3], [4], [5]]);
});

Deno.test("slidingWindows() handles a Map", () => {
  const map = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
    ["e", 5],
  ]);
  slidingWindowsTest([map, 3], [
    [["a", 1], ["b", 2], ["c", 3]],
    [["b", 2], ["c", 3], ["d", 4]],
    [["c", 3], ["d", 4], ["e", 5]],
  ]);
  slidingWindowsTest([map, 1], [
    [["a", 1]],
    [["b", 2]],
    [["c", 3]],
    [["d", 4]],
    [["e", 5]],
  ]);
});
