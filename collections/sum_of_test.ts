// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { sumOf } from "./sum_of.ts";

Deno.test("sumOf() handles object properties", () => {
  const object = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const actual = sumOf(object, (i) => i.age);

  assertEquals(actual, 99);
});

Deno.test("sumOf() adds 2 to each num", () => {
  const array = [1, 2, 3];

  const actual = sumOf(array, (i) => i + 2);

  assertEquals(actual, 12);
});

Deno.test("sumOf() handles regular sum", () => {
  const array = [1, 2, 3];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, 6);
});

Deno.test("sumOf() handles negatives with regular sum", () => {
  const array = [-1, -2, -3];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, -6);
});

Deno.test("sumOf() handles mixed negatives and positives with regular sum", () => {
  const array = [-1, 2, 3, -5];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, -1);
});

Deno.test("sumOf() turns selector nums into negatives", () => {
  const array = [1, 3, 5, 3];

  const actual = sumOf(array, (i) => i - 6);

  assertEquals(actual, -12);
});

Deno.test("sumOf() turns selector nums into zeros", () => {
  const array = [3, 3, 3, 3];

  const actual = sumOf(array, (i) => i - 3);

  assertEquals(actual, 0);
});

Deno.test("sumOf() handles negative object properties", () => {
  const object = [
    { name: "Kyle", age: -34 },
    { name: "John", age: -42 },
    { name: "Anna", age: -23 },
  ];

  const actual = sumOf(object, (i) => i.age);

  assertEquals(actual, -99);
});

Deno.test("sumOf() handles mixed object properties", () => {
  const object = [
    { name: "Kyle", age: -34 },
    { name: "John", age: 42 },
    { name: "Anna", age: -23 },
  ];

  const actual = sumOf(object, (i) => i.age);

  assertEquals(actual, -15);
});

Deno.test("sumOf() handles no mutation", () => {
  const array = [1, 2, 3, 4];

  sumOf(array, (i) => i + 2);

  assertEquals(array, [1, 2, 3, 4]);
});

Deno.test("sumOf() handles empty array results in 0", () => {
  const array: number[] = [];

  const actual = sumOf(array, (i) => i + 2);

  assertEquals(actual, 0);
});

Deno.test("sumOf() handles NaN and Infinity", () => {
  const array = [
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

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, NaN);
});

Deno.test("sumOf() handles Infinity", () => {
  const array = [1, 2, Infinity, 3, 4, 5, 6, 7, 8];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, Infinity);
});
