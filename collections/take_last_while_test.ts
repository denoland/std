// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { takeLastWhile } from "./take_last_while.ts";

Deno.test("takeLastWhile() handles num array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeLastWhile(arr, (i) => i !== 4);

  assertEquals(actual, [5, 6]);
});

Deno.test("takeLastWhile() adds two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeLastWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [5, 6]);
});

Deno.test("takeLastWhile() handles negatives", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = takeLastWhile(arr, (i) => i < -4);
  assertEquals(actual, [-5, -6]);
});

Deno.test("takeLastWhile() handles no mutation", () => {
  const arr = [1, 2, 3, 4, 5, 6];

  const actual = takeLastWhile(arr, (i) => i !== 4);
  assertEquals(actual, [5, 6]);
  assertEquals(arr, [1, 2, 3, 4, 5, 6]);
});

Deno.test("takeLastWhile() handles empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = takeLastWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("takeLastWhile() returns empty array when the last element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeLastWhile(arr, (i) => i !== 4);

  assertEquals(actual, []);
});

Deno.test("takeLastWhile() returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeLastWhile(arr, (i) => i !== 400);

  assertEquals(actual, [1, 2, 3, 4]);
});
