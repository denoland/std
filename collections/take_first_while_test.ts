// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { takeFirstWhile } from "./take_first_while.ts";

Deno.test("[collections/takeFirstWhile] Num array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeFirstWhile(arr, (i) => i !== 4);

  assertEquals(actual, [1, 2, 3]);
});

Deno.test("[collections/takeFirstWhile] Add two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = takeFirstWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [1, 2, 3]);
});

Deno.test("[collections/takeFirstWhile] Negatives", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = takeFirstWhile(arr, (i) => i > -4);
  assertEquals(actual, [-1, -2, -3]);
});

Deno.test("[collections/takeFirstWhile] No mutation", () => {
  const arr = [-1, -2, -3, -4, -5, -6];

  const actual = takeFirstWhile(arr, (i) => i > -4);
  assertEquals(actual, [-1, -2, -3]);
  assertEquals(arr, [-1, -2, -3, -4, -5, -6]);
});

Deno.test("[collections/takeFirstWhile] Empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = takeFirstWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("[collections/takeFirstWhile] Returns empty array when the first element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeFirstWhile(arr, (i) => i !== 1);

  assertEquals(actual, []);
})

Deno.test("[collections/takeFirstWhile] Returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = takeFirstWhile(arr, (i) => i != 400);

  assertEquals(actual, [1, 2, 3, 4]);
})