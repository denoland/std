// Copyright 2018-2026 the Deno authors. MIT license.
import { minOf } from "./min_of.ts";
import { assertEquals } from "@std/assert";
import * as unstable from "./unstable_min_of.ts";

Deno.test("minOf() handles regular min", () => {
  const array = [5, 18, 35, 120];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, 5);
});

Deno.test("minOf() handles single element", () => {
  const actual = minOf([42], (i) => i);
  assertEquals(actual, 42);
});

Deno.test("minOf() handles mixed negatives and positives numbers", () => {
  const array = [-32, -18, 140, 36];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, -32);
});

Deno.test("minOf() handles negatives numbers", () => {
  const array = [-32, -18, -140, -36];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, -140);
});

Deno.test("minOf() handles BigInt regular min", () => {
  const array = [BigInt(5), BigInt(18), BigInt(35), BigInt(120)];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, BigInt(5));
});

Deno.test("minOf() handles BigInt negatives numbers", () => {
  const array = [BigInt(-32), BigInt(-18), BigInt(-140), BigInt(-36)];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, BigInt(-140));
});

Deno.test("minOf() handles object properties", () => {
  const object = [
    { name: "mustard", count: 2 },
    { name: "soy", count: 4 },
    { name: "tomato", count: 32 },
  ];

  const actual = minOf(object, (i) => i.count);
  assertEquals(actual, 2);
});

Deno.test("minOf() handles mixed object properties", () => {
  const object = [
    { name: "mustard", count: -2 },
    { name: "soy", count: 4 },
    { name: "tomato", count: -32 },
  ];

  const actual = minOf(object, (i) => i.count);
  assertEquals(actual, -32);
});

Deno.test("minOf() handles no mutation", () => {
  const array = [1, 2, 3, 4];

  minOf(array, (i) => i + 2);

  assertEquals(array, [1, 2, 3, 4]);
});

Deno.test("minOf() handles iterable input", () => {
  function* generate() {
    yield 5;
    yield 2;
    yield 8;
    yield 1;
  }

  const actual = minOf(generate(), (i) => i);
  assertEquals(actual, 1);
});

Deno.test("minOf() handles empty iterable", () => {
  function* generate(): Generator<number> {}

  const actual = minOf(generate(), (i) => i);
  assertEquals(actual, undefined);
});

Deno.test("minOf() handles NaN in iterable", () => {
  function* generate() {
    yield 1;
    yield NaN;
    yield 3;
  }

  const actual = minOf(generate(), (i) => i);
  assertEquals(actual, NaN);
});

Deno.test("minOf() handles empty array results in undefined", () => {
  const array: number[] = [];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, undefined);
});

Deno.test("minOf() handles NaN and Infinity", () => {
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

Deno.test("minOf() handles NaN as first element", () => {
  const array = [NaN, 1, 2, 3];

  const actual = minOf(array, (i) => i);
  assertEquals(actual, NaN);
});

Deno.test("minOf() handles minus infinity", () => {
  const array = [1, 2, -Infinity, 3, 4, 5, 6, 7, 8];

  const actual = minOf(array, (i) => i);

  assertEquals(actual, -Infinity);
});

Deno.test({
  name: "unstable.minOf() passes index to selector",
  fn() {
    const input = [4, 3, 2, 1];

    const max = unstable.minOf(input, (it, index) => it * index);

    assertEquals(max, 0);
  },
});
