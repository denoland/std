// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { dropLastWhile } from "./drop_last_while.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("Num array", () => {
  const values = [20, 33, 44];

  const actual = dropLastWhile(values, (i) => i > 30);

  assertEquals(actual, [20]);
});

Deno.test("No mutation", () => {
  const array = [1, 2, 3, 4, 5, 6];

  const actual = dropLastWhile(array, (i) => i > 4);

  assertEquals(actual, [1, 2, 3, 4]);
  assertEquals(array, [1, 2, 3, 4, 5, 6]);
});

Deno.test("Negatives", () => {
  const array = [-1, -2, -3, -4, -5, -6];

  const actual = dropLastWhile(array, (i) => i < -4);

  assertEquals(actual, [-1, -2, -3, -4]);
});

Deno.test("Empty input returns empty array", () => {
  const array: number[] = [];

  const actual = dropLastWhile(array, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("Returns same array when the last element doesn't get dropped", () => {
  const array = [40, 30, 20];

  const actual = dropLastWhile(array, (i) => i > 40);

  assertEquals(actual, [40, 30, 20]);
});

Deno.test("Returns empty array when all elements get dropped", () => {
  const array = [20, 30, 20];

  const actual = dropLastWhile(array, (i) => i < 40);

  assertEquals(actual, []);
});
