// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { minOf } from "./min_of.ts";
import { assertEquals } from "../assert/mod.ts";

Deno.test("minOf() checks regular min", () => {
  const array = [5, 18, 35, 120];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, 5);
});

Deno.test("minOf() checks mixed negatives and positives numbers", () => {
  const array = [-32, -18, 140, 36];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, -32);
});

Deno.test("minOf() checks negatives numbers", () => {
  const array = [-32, -18, -140, -36];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, -140);
});

Deno.test("minOf() checks BigInt regular min", () => {
  const array = [BigInt(5), BigInt(18), BigInt(35), BigInt(120)];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, BigInt(5));
});

Deno.test("minOf() checks BigInt negatives numbers", () => {
  const array = [BigInt(-32), BigInt(-18), BigInt(-140), BigInt(-36)];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, BigInt(-140));
});

Deno.test("minOf() checks object properties", () => {
  const object = [
    { name: "mustard", count: 2 },
    { name: "soy", count: 4 },
    { name: "tomato", count: 32 },
  ];

  const actual = minOf(object, (i) => i.count);
  assertEquals(actual, 2);
});

Deno.test("minOf() checks mixed object properties", () => {
  const object = [
    { name: "mustard", count: -2 },
    { name: "soy", count: 4 },
    { name: "tomato", count: -32 },
  ];

  const actual = minOf(object, (i) => i.count);
  assertEquals(actual, -32);
});

Deno.test("minOf() checks no mutation", () => {
  const array = [1, 2, 3, 4];

  minOf(array, (i) => i + 2);

  assertEquals(array, [1, 2, 3, 4]);
});

Deno.test("minOf() checks empty array results in undefined", () => {
  const array: number[] = [];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, undefined);
});

Deno.test("minOf() checks NaN and Infinity", () => {
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

  const actual = minOf(array, (i) => i);
  assertEquals(actual, NaN);
});

Deno.test("minOf() checks minus infinity", () => {
  const array = [1, 2, -Infinity, 3, 4, 5, 6, 7, 8];

  const actual = minOf(array, (i) => i);

  assertEquals(actual, -Infinity);
});
