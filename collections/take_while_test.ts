// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { takeWhile } from "./take_while.ts";
import { takeWhile as unstableTakeWhile } from "./unstable_take_while.ts";

Deno.test("takeWhile() handles num array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeWhile(arr, (i) => i !== 4);

  assertEquals(actual, [1, 2, 3]);
});

Deno.test("takeWhile() adds two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [1, 2, 3]);
});

Deno.test("takeWhile() handles negatives", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = takeWhile(arr, (i) => i > -4);
  assertEquals(actual, [-1, -2, -3]);
});

Deno.test("takeWhile() handles no mutation", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = takeWhile(arr, (i) => i > -4);
  assertEquals(actual, [-1, -2, -3]);
  assertEquals(arr, [-1, -2, -3, -4, -5, -6]);
});

Deno.test("takeWhile() handles empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = takeWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("takeWhile() returns empty array when the first element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeWhile(arr, (i) => i !== 1);

  assertEquals(actual, []);
});

Deno.test("takeWhile() returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeWhile(arr, (i) => i !== 400);

  assertEquals(actual, [1, 2, 3, 4]);
});

Deno.test("(unstable) takeWhile() handles num array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = unstableTakeWhile(arr, (i) => i !== 4);

  assertEquals(actual, [1, 2, 3]);
});

Deno.test("(unstable) takeWhile() adds two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = unstableTakeWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [1, 2, 3]);
});

Deno.test("(unstable) takeWhile() handles negatives", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = unstableTakeWhile(arr, (i) => i > -4);
  assertEquals(actual, [-1, -2, -3]);
});

Deno.test("(unstable) takeWhile() handles no mutation", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = unstableTakeWhile(arr, (i) => i > -4);
  assertEquals(actual, [-1, -2, -3]);
  assertEquals(arr, [-1, -2, -3, -4, -5, -6]);
});

Deno.test("(unstable) takeWhile() handles empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = unstableTakeWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("(unstable) takeWhile() returns empty array when the first element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = unstableTakeWhile(arr, (i) => i !== 1);

  assertEquals(actual, []);
});

Deno.test("(unstable) takeWhile() returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = unstableTakeWhile(arr, (i) => i !== 400);

  assertEquals(actual, [1, 2, 3, 4]);
});

Deno.test("(unstable) takeWhile() handles a generator", () => {
  function* infiniteCount() {
    let count = 0;
    while (true) {
      count++;
      yield count;
    }
  }
  const actual = unstableTakeWhile(infiniteCount(), (i) => i !== 4);
  assertEquals(actual, [1, 2, 3]);
});

Deno.test("(unstable) takeWhile() handles a Set", () => {
  const set = new Set([1, 2, 3, 4, 5, 6]);
  const actual = unstableTakeWhile(set, (i) => i !== 4);
  assertEquals(actual, [1, 2, 3]);
});

Deno.test("(unstable) takeWhile() handles a Map", () => {
  const map = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
    ["d", 4],
    ["e", 5],
    ["f", 6],
  ]);
  const actual = unstableTakeWhile(map, ([, i]) => i !== 4);
  assertEquals(actual, [
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]);
});
