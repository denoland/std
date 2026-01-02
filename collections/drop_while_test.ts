// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { dropWhile } from "./drop_while.ts";

Deno.test("dropWhile() handles Array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i !== 2);

  assertEquals(actual, [2, 3, 4, 5, 6]);
});

Deno.test("dropWhile() adds two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [4, 5, 6]);
});

Deno.test("dropWhile() handles negatives", () => {
  const arr = [-5, -6];

  const actual = dropWhile(arr, (i) => i < -4);
  assertEquals(actual, []);
});

Deno.test("dropWhile() doesn't mutate input array", () => {
  const arr = [1, 2, 3, 4, 5, 6];

  const actual = dropWhile(arr, (i) => i !== 4);
  assertEquals(actual, [4, 5, 6]);
  assertEquals(arr, [1, 2, 3, 4, 5, 6]);
});

Deno.test("dropWhile() handles empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = dropWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("dropWhile() returns the empty array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropWhile(arr, (i) => i !== 400);

  assertEquals(actual, []);
});

Deno.test("dropWhile() returns full elements when the first element satisfies the predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i !== 1);

  assertEquals(actual, [1, 2, 3, 4, 5, 6]);
});

Deno.test("dropWhile() with (i) => i + 2 !== 6", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [4, 5, 6]);
});

Deno.test("dropWhile() returns empty array when the input is empty", () => {
  const arr: number[] = [];

  const actual = dropWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("dropWhile() handles a generator", () => {
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

Deno.test("dropWhile() handles a Set", () => {
  const set = new Set([1, 2, 3, 4, 5, 6]);
  const actual = dropWhile(set, (i) => i !== 4);
  assertEquals(actual, [4, 5, 6]);
});

Deno.test("dropWhile() handles a Map", () => {
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
