// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { takeWhile } from "./take_while.ts";

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
