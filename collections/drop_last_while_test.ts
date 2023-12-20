// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { dropLastWhile } from "./drop_last_while.ts";
import { assertEquals } from "../assert/mod.ts";

Deno.test("dropLastWhile() handles num array", () => {
  const values = [20, 33, 44];

  const actual = dropLastWhile(values, (i) => i > 30);

  assertEquals(actual, [20]);
});

Deno.test("dropLastWhile() handles no mutation", () => {
  const array = [1, 2, 3, 4, 5, 6];

  const actual = dropLastWhile(array, (i) => i > 4);

  assertEquals(actual, [1, 2, 3, 4]);
  assertEquals(array, [1, 2, 3, 4, 5, 6]);
});

Deno.test("dropLastWhile() handles negatives", () => {
  const array = [-1, -2, -3, -4, -5, -6];

  const actual = dropLastWhile(array, (i) => i < -4);

  assertEquals(actual, [-1, -2, -3, -4]);
});

Deno.test("dropLastWhile() handles empty input returns empty array", () => {
  const array: number[] = [];

  const actual = dropLastWhile(array, (i) => i > 4);

  assertEquals(actual, []);
});

Deno.test("dropLastWhile() returns same array when the last element doesn't get dropped", () => {
  const array = [40, 30, 20];

  const actual = dropLastWhile(array, (i) => i > 40);

  assertEquals(actual, [40, 30, 20]);
});

Deno.test("dropLastWhile() returns empty array when all elements get dropped", () => {
  const array = [20, 30, 20];

  const actual = dropLastWhile(array, (i) => i < 40);

  assertEquals(actual, []);
});
