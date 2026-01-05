// Copyright 2018-2026 the Deno authors. MIT license.
import { maxOf } from "./max_of.ts";
import { assertEquals } from "@std/assert";

Deno.test("maxOf() handles regular max", () => {
  const array = [5, 18, 35, 120];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, 120);
});

Deno.test("maxOf() handles single element", () => {
  const actual = maxOf([42], (i) => i);
  assertEquals(actual, 42);
});

Deno.test("maxOf() handles mixed negatives and positives numbers", () => {
  const array = [-32, -18, 140, 36];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, 140);
});

Deno.test("maxOf() handles negatives numbers", () => {
  const array = [-32, -18, -140, -36];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, -18);
});

Deno.test("maxOf() handles BigInt regular max", () => {
  const array = [BigInt(5), BigInt(18), BigInt(35), BigInt(120)];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, BigInt(120));
});

Deno.test("maxOf() handles BigInt negatives numbers", () => {
  const array = [BigInt(-32), BigInt(-18), BigInt(-140), BigInt(-36)];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, BigInt(-18));
});

Deno.test("maxOf() handles object properties", () => {
  const object = [
    { name: "mustard", count: 2 },
    { name: "soy", count: 4 },
    { name: "tomato", count: 32 },
  ];

  const actual = maxOf(object, (i) => i.count);
  assertEquals(actual, 32);
});

Deno.test("maxOf() handles mixed object properties", () => {
  const object = [
    { name: "mustard", count: -2 },
    { name: "soy", count: 4 },
    { name: "tomato", count: -32 },
  ];

  const actual = maxOf(object, (i) => i.count);
  assertEquals(actual, 4);
});

Deno.test("maxOf() handles no mutation", () => {
  const array = [1, 2, 3, 4];

  maxOf(array, (i) => i + 2);

  assertEquals(array, [1, 2, 3, 4]);
});

Deno.test("maxOf() handles iterable input", () => {
  function* generate() {
    yield 5;
    yield 2;
    yield 8;
    yield 1;
  }

  const actual = maxOf(generate(), (i) => i);
  assertEquals(actual, 8);
});

Deno.test("maxOf() handles empty iterable", () => {
  function* generate(): Generator<number> {}

  const actual = maxOf(generate(), (i) => i);
  assertEquals(actual, undefined);
});

Deno.test("maxOf() handles NaN in iterable", () => {
  function* generate() {
    yield 1;
    yield NaN;
    yield 3;
  }

  const actual = maxOf(generate(), (i) => i);
  assertEquals(actual, NaN);
});

Deno.test("maxOf() handles empty array results in undefined", () => {
  const array: number[] = [];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, undefined);
});

Deno.test("maxOf() handles NaN and Infinity", () => {
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

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, NaN);
});

Deno.test("maxOf() handles NaN as first element", () => {
  const array = [NaN, 1, 2, 3];

  const actual = maxOf(array, (i) => i);
  assertEquals(actual, NaN);
});

Deno.test("maxOf() handles infinity", () => {
  const array = [1, 2, Infinity, 3, 4, 5, 6, 7, 8];

  const actual = maxOf(array, (i) => i);

  assertEquals(actual, Infinity);
});
