// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { chunk } from "./unstable_chunk.ts";

Deno.test("(unstable) chunk() does not mutate the input", () => {
  const array = [1, 2, 3, 4];
  chunk(array, 2);
  assertEquals(array, [1, 2, 3, 4], "Input array should not be mutated");
});

Deno.test("(unstable) chunk() throws on non naturals", () => {
  assertThrows(
    () => chunk([], +.5),
    RangeError,
    "Expected size to be an integer greater than 0 but found 0.5",
  );
  assertThrows(
    () => chunk([], -4.7),
    RangeError,
    "Expected size to be an integer greater than 0 but found -4.7",
  );
  assertThrows(
    () => chunk([], -2),
    RangeError,
    "Expected size to be an integer greater than 0 but found -2",
  );
  assertThrows(
    () => chunk([], +0),
    RangeError,
    "Expected size to be an integer greater than 0 but found 0",
  );
  assertThrows(
    () => chunk([], -0),
    RangeError,
    "Expected size to be an integer greater than 0 but found 0",
  );
});

Deno.test("(unstable) chunk() returns empty array when input is empty", () => {
  const actual = chunk([], 1);
  assertEquals(actual, [], "Empty input should return empty array");
});

Deno.test({
  name: "(unstable) chunk() handles single element chunks",
  fn() {
    assertEquals(chunk([1, 2, 3, 4, 5, 6], 1), [[1], [2], [3], [4], [5], [6]]);
    assertEquals(chunk(["foo"], 1), [["foo"]]);
    assertEquals(chunk([null], 1), [[null]]);
    assertEquals(chunk([undefined], 1), [[undefined]]);
  },
});

Deno.test("(unstable) chunk() handles n chunks fitting", () => {
  assertEquals(
    chunk([1, 2, 3, 4, 5, 6], 2),
    [[1, 2], [3, 4], [5, 6]],
    "size=2",
  );
  assertEquals(chunk([1, 2, 3, 4, 5, 6], 3), [[1, 2, 3], [4, 5, 6]], "size=3");
});

Deno.test("chunk() handles n chunks not fitting", () => {
  assertEquals(
    chunk([1, 2, 3, 4, 5, 6], 4),
    [[1, 2, 3, 4], [5, 6]],
    "size 4 with 6 elements should return 2 chunks with 4 and 2 elements",
  );
  assertEquals(
    chunk([1, 2, 3, 4, 5, 6], 5),
    [[1, 2, 3, 4, 5], [6]],
    "size 5 with 6 elements should return 2 chunks with 5 and 1 elements",
  );
});

Deno.test("(unstable) chunk() handles n chunks larger than input length", () => {
  assertEquals(
    chunk([1, 2, 3, 4, 5, 6], 10),
    [[1, 2, 3, 4, 5, 6]],
  );
});

Deno.test({
  name: "(unstable) chunk() handles chunks equal to length",
  fn() {
    assertEquals(
      chunk([1, 2, 3, 4, 5, 6], 6),
      [[1, 2, 3, 4, 5, 6]],
    );
  },
});

Deno.test("(unstable) chunk() handles a generator", () => {
  function* gen() {
    yield "a";
    yield "b";
    yield "c";
    yield "d";
  }
  assertEquals(chunk(gen(), 1), [["a"], ["b"], ["c"], ["d"]], "size = 1");
  assertEquals(chunk(gen(), 2), [["a", "b"], ["c", "d"]], "size = 2");
  assertEquals(chunk(gen(), 3), [["a", "b", "c"], ["d"]], "size = 3");
  assertEquals(chunk(gen(), 4), [["a", "b", "c", "d"]], "size = gen.length");
  assertEquals(chunk(gen(), 5), [["a", "b", "c", "d"]], "size > gen.length");
});

Deno.test("(unstable) chunk() handles a string", () => {
  assertEquals(chunk("abcdefg", 4), [
    ["a", "b", "c", "d"],
    ["e", "f", "g"],
  ]);
});

Deno.test("(unstable) chunk() handles a Set", () => {
  const set = new Set([1, 2, 3, 4, 5, 6]);
  assertEquals(chunk(set, 2), [
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
});

Deno.test("(unstable) chunk() handles a Map", () => {
  const map = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
    ["e", 5],
    ["f", 6],
  ]);
  assertEquals(chunk(map, 2), [
    [
      ["a", 1],
      ["b", 2],
    ],
    [
      ["c", 3],
      ["d", 4],
    ],
    [
      ["e", 5],
      ["f", 6],
    ],
  ]);
});

Deno.test("(unstable) chunk() handles user-defined iterable", () => {
  class MyIterable {
    *[Symbol.iterator]() {
      yield 1;
      yield 2;
      yield 3;
      yield 4;
      yield 5;
      yield 6;
    }
  }
  assertEquals(chunk(new MyIterable(), 2), [
    [1, 2],
    [3, 4],
    [5, 6],
  ]);
});

Deno.test("(unstable) chunk() handles a TypedArrays", () => {
  const typedArrays = [
    Uint8Array,
    Uint8ClampedArray,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
  ];
  for (const TypedArray of typedArrays) {
    const array = new TypedArray([1, 2, 3, 4, 5, 6]);
    assertEquals(chunk(array, 2), [
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  }
});

Deno.test("(unstable) chunk() handles an array with empty slots", () => {
  // Regression test for chunk that only allowed Array instances instead of any Iterable.
  // This is a special case where an array is filled with empty slots which is a different kind of nothing than null or undefined
  // Typed arrays are not affected, as they are filled with 0 instead of empty slots
  const arr = new Array(4);
  arr[2] = 3;

  const expectedSecondChunk = new Array(2);
  expectedSecondChunk[0] = 3;
  assertEquals(chunk(arr, 2), [
    new Array(2),
    expectedSecondChunk,
  ]);
});
