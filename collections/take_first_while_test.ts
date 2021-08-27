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

Deno.test("[collections/sumOf] NaN and Infinity", () => {
  const arr = [
    1,
    2,
    Number.POSITIVE_INFINITY,
    3,
    4,
    Number.NEGATIVE_INFINITY,
    5,
    6,
    Number.NaN,
    7,
    8,
  ];

  const actual = takeFirstWhile(arr, (i) => i != Number.POSITIVE_INFINITY);

  assertEquals(actual, [1, 2]);

  const actual2 = takeFirstWhile(arr, (i) => i != Number.NEGATIVE_INFINITY);

  assertEquals(actual2, [1, 2, Number.POSITIVE_INFINITY, 3, 4]);

  const actual3 = takeFirstWhile(arr, (i) => !(Number.isNaN(i)));

  assertEquals(actual3, [
    1,
    2,
    Number.POSITIVE_INFINITY,
    3,
    4,
    Number.NEGATIVE_INFINITY,
    5,
    6,
  ]);
});

Deno.test("[collections/takeFirstWhile] Empty array returns empty array", () => {
  const arr: number[] = [];

  const actual = takeFirstWhile(arr, (i) => i > 4);

  assertEquals(actual, []);
});
