// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { chunk } from "./chunk.ts";

function chunkTest<I>(
  input: [Array<I>, number],
  expected: Array<Array<I>>,
  message?: string,
) {
  const actual = chunk(...input);
  assertEquals(actual, expected, message);
}

const testArray = [1, 2, 3, 4, 5, 6];

Deno.test({
  name: "chunk() handles no mutation",
  fn() {
    const array = [1, 2, 3, 4];
    chunk(array, 2);

    assertEquals(array, [1, 2, 3, 4]);
  },
});

Deno.test({
  name: "chunk() throws on non naturals",
  fn() {
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
  },
});

Deno.test({
  name: "chunk() handles empty input",
  fn() {
    chunkTest(
      [[], 1],
      [],
    );
  },
});

Deno.test({
  name: "chunk() handles single element chunks",
  fn() {
    chunkTest(
      [testArray, 1],
      testArray.map((it) => [it]),
    );
    chunkTest(
      [["foo"], 1],
      [["foo"]],
    );
  },
});

Deno.test({
  name: "chunk() handles n chunks fitting",
  fn() {
    chunkTest(
      [testArray, 2],
      [[1, 2], [3, 4], [5, 6]],
    );
    chunkTest(
      [testArray, 3],
      [[1, 2, 3], [4, 5, 6]],
    );
  },
});

Deno.test({
  name: "chunk() handles n chunks not fitting",
  fn() {
    chunkTest(
      [testArray, 4],
      [[1, 2, 3, 4], [5, 6]],
    );
    chunkTest(
      [testArray, 5],
      [[1, 2, 3, 4, 5], [6]],
    );
  },
});

Deno.test({
  name: "chunk() handles chunks equal to length",
  fn() {
    chunkTest(
      [testArray, testArray.length],
      [testArray],
    );
    chunkTest(
      [["foo"], 1],
      [["foo"]],
    );
  },
});
