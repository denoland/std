// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
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

Deno.test("dropWhile() handles no mutation", () => {
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

Deno.test("dropWhile() returns empty array when the last element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropWhile(arr, (i) => i !== 4);

  assertEquals(actual, [4]);
});

Deno.test("dropWhile() returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropWhile(arr, (i) => i !== 400);

  assertEquals(actual, []);
});
