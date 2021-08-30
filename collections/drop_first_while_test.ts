// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { dropFirstWhile } from "./drop_first_while.ts";

Deno.test("[collections/dropFirstWhile] Array", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropFirstWhile(arr, (i) => i !== 2);

  assertEquals(actual, [3, 4, 5, 6]);
});

Deno.test("[collections/dropFirstWhile] Add two to each num in predicate", () => {
  const arr = [1, 2, 3, 4, 5, 6];
  const actual = dropFirstWhile(arr, (i) => i + 2 !== 6);

  assertEquals(actual, [5, 6]);
});

Deno.test("[collections/dropFirstWhile] Negatives", () => {
  const arr = [-5, -6];

  const actual = dropFirstWhile(arr, (i) => i < -4);
  assertEquals(actual, []);
});

Deno.test("[collections/dropFirstWhile] No mutation", () => {
  const arr = [1, 2, 3, 4, 5, 6];

  const actual = dropFirstWhile(arr, (i) => i !== 4);
  assertEquals(actual, [5, 6]);
  assertEquals(arr, [1, 2, 3, 4, 5, 6]);
});

Deno.test("[collections/dropFirstWhile] Empty input array returns empty array", () => {
  const arr: number[] = [];

  const actual = dropFirstWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("[collections/dropFirstWhile] Returns empty array when the last element doesn't match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropFirstWhile(arr, (i) => i !== 4);

  assertEquals(actual, []);
});

Deno.test("[collections/dropFirstWhile] Returns the same array when all elements match the predicate", () => {
  const arr = [1, 2, 3, 4];

  const actual = dropFirstWhile(arr, (i) => i !== 400);

  assertEquals(actual, []);
});
