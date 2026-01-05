// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { sample } from "./sample.ts";

Deno.test({
  name: "sample() does not mutate input",
  fn() {
    const array = ["a", "abc", "ba"];
    sample(array);

    assertEquals(array, ["a", "abc", "ba"]);
  },
});

Deno.test({
  name: "sample() handles empty input",
  fn() {
    const actual = sample([]);
    assertEquals(actual, undefined);
  },
});

Deno.test({
  name: "sample() handles array of numbers",
  fn() {
    const input = [1, 2, 3];
    const actual = sample([1, 2, 3]);

    assert(actual && input.includes(actual));
  },
});

Deno.test({
  name: "sample() handles array of objects",
  fn() {
    const input = [
      {
        name: "Anna",
        age: 18,
      },
      {
        name: "Kim",
        age: 24,
      },
    ];
    const actual = sample(input);

    assert(actual && input.includes(actual));
  },
});

Deno.test("sample() returns the first element if there is only one element", () => {
  const input = [1];
  const actual = sample(input);
  assertEquals(actual, 1);
});

Deno.test("sample() handles a generator", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
  }
  const actual = sample(gen());
  assert(actual !== undefined);
  assert(Array.from(gen()).includes(actual));
});

Deno.test("sample() handles a Set", () => {
  const input = new Set([1, 2, 3]);
  const actual = sample(input);
  assert(actual !== undefined);
  assert(input.has(actual));
});

Deno.test("sample() handles a Map", () => {
  const input = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]);
  const actual = sample(input);
  assert(actual !== undefined);
  assert(Array.isArray(actual));
  assert(actual.length === 2);
  assert(input.has(actual[0]));
  assert(input.get(actual[0]) === actual[1]);
});

Deno.test("sample() handles TypedArrays", () => {
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
    const input = new TypedArray([1, 2, 3]);
    const actual = sample(input);
    assert(actual !== undefined);
    assert(input.includes(actual));
  }
});

Deno.test("sample() handles a string", () => {
  const input = "abc";
  const actual = sample("abc");
  assert(actual !== undefined);
  assert(actual.length === 1);
  assert(input.includes(actual));
});

Deno.test("sample() handles user-defined iterable", () => {
  const iterable = {
    *[Symbol.iterator]() {
      yield "a";
      yield "b";
      yield "c";
    },
  };
  const actual = sample(iterable);
  assert(actual !== undefined);
  assert(["a", "b", "c"].includes(actual));
});
