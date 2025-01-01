// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { dropWhile } from "./unstable_drop_while.ts";

Deno.test("(unstable) dropWhile matches first element", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i !== 1);

  assertEquals(actual, [1, 2, 3, 4, 5, 6]);
});

Deno.test("(unstable) dropWhile() handles Array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i !== 2);

  assertEquals(actual, [2, 3, 4, 5, 6]);
});

Deno.test("(unstable) dropWhile() adds two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [4, 5, 6]);
});

Deno.test("(unstable) dropWhile() handles negatives", () => {
  const arr = [-5, -6];

  const actual = dropWhile(arr, (i) => i < -4);
  assertEquals(actual, []);
});

Deno.test("(unstable) dropWhile() handles no mutation", () => {
  const arr = [1, 2, 3, 4, 5, 6];

  const actual = dropWhile(arr, (i) => i !== 4);
  assertEquals(actual, [4, 5, 6]);
  assertEquals(arr, [1, 2, 3, 4, 5, 6]);
});

Deno.test("(unstable) dropWhile() handles empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = dropWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("(unstable) dropWhile() returns empty array when the last element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropWhile(arr, (i) => i !== 4);

  assertEquals(actual, [4]);
});

Deno.test("(unstable) dropWhile() returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropWhile(arr, (i) => i !== 400);

  assertEquals(actual, []);
});

Deno.test("(unstable) dropWhile() handles a generator", () => {
  function* gen() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
    yield 6;
  }

  const actual = dropWhile(gen(), (i) => i !== 4);
  assertEquals(actual, [4, 5, 6]);
});

Deno.test("(unstable) dropWhile() handles a Set", () => {
  const set = new Set([1, 2, 3, 4, 5, 6]);
  const actual = dropWhile(set, (i) => i !== 4);
  assertEquals(actual, [4, 5, 6]);
});

Deno.test("(unstable) dropWhile() handles a Map", () => {
  const map = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
    ["e", 5],
    ["f", 6],
  ]);

  const actual = dropWhile(map, ([_k, v]) => v !== 4);
  assertEquals(actual, [
    ["d", 4],
    ["e", 5],
    ["f", 6],
  ]);
});
