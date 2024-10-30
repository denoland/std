// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";

Deno.test("expect.arrayContaining() with array of numbers", () => {
  const arr = [1, 2, 3];
  expect([1, 2, 3, 4]).toEqual(expect.arrayContaining(arr));
  expect([4, 5, 6]).not.toEqual(expect.arrayContaining(arr));
  expect([1, 2, 3]).toEqual(expect.arrayContaining(arr));
});

Deno.test("expect.arrayContaining() with array of mixed types", () => {
  const arr = [1, 2, "hello"];
  expect([1, 2, 3, "hello", "bye"]).toEqual(expect.arrayContaining(arr));
  expect([4, "bye"]).not.toEqual(expect.arrayContaining(arr));
});

Deno.test("expect.not.arrayContaining with array of numbers", () => {
  const arr = [7, 8, 9];
  expect([1, 2, 3, 4]).toEqual(expect.not.arrayContaining(arr));
  expect([1, 2, 3, 4]).not.toEqual(expect.arrayContaining(arr));
  expect([4, 5, 6, 7]).toEqual(expect.not.arrayContaining(arr));
  expect([4, 5, 6, 7]).not.toEqual(expect.arrayContaining(arr));
});

Deno.test("expect.arrayContaining() with array of mixed types", () => {
  const arr = [5, "world"];
  expect([1, 2, 3, "hello", "bye"]).toEqual(expect.not.arrayContaining(arr));
  expect([4, "bye"]).not.toEqual(expect.arrayContaining(arr));
});
