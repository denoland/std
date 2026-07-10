// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { averageOf } from "./average_of.ts";

Deno.test("averageOf() handles object properties", () => {
  const people = [
    { name: "Anna", age: 34 },
    { name: "Kim", age: 42 },
    { name: "John", age: 23 },
  ];

  const actual = averageOf(people, (person) => person.age);

  assertEquals(actual, 33);
});

Deno.test("averageOf() handles regular average", () => {
  const array = [1, 2, 3];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, 2);
});

Deno.test("averageOf() handles negatives", () => {
  const array = [-1, -2, -3];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, -2);
});

Deno.test("averageOf() handles mixed negatives and positives", () => {
  const array = [-1, 2, 3, -5];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, -0.25);
});

Deno.test("averageOf() handles selector transformation", () => {
  const array = [1, 3, 5, 3];

  const actual = averageOf(array, (i) => i + 10);

  assertEquals(actual, 13);
});

Deno.test("averageOf() handles negative object properties", () => {
  const people = [
    { name: "Anna", age: -34 },
    { name: "Kim", age: -42 },
    { name: "John", age: -23 },
  ];

  const actual = averageOf(people, (person) => person.age);

  assertEquals(actual, -33);
});

Deno.test("averageOf() handles mixed object properties", () => {
  const people = [
    { name: "Anna", age: -34 },
    { name: "Kim", age: 42 },
    { name: "John", age: -23 },
  ];

  const actual = averageOf(people, (person) => person.age);

  assertEquals(actual, -5);
});

Deno.test("averageOf() handles single element", () => {
  const array = [42];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, 42);
});

Deno.test("averageOf() handles no mutation", () => {
  const array = [1, 2, 3, 4];

  averageOf(array, (i) => i + 2);

  assertEquals(array, [1, 2, 3, 4]);
});

Deno.test("averageOf() handles empty array results in NaN", () => {
  const array: number[] = [];

  const actual = averageOf(array, (i) => i + 2);

  assertEquals(actual, NaN);
});

Deno.test("averageOf() handles Infinity and -Infinity resulting in NaN", () => {
  const array = [
    1,
    2,
    Number.POSITIVE_INFINITY,
    3,
    4,
    Number.NEGATIVE_INFINITY,
    5,
  ];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, NaN);
});

Deno.test("averageOf() handles Infinity", () => {
  const array = [1, 2, Infinity, 3, 4];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, Infinity);
});

Deno.test("averageOf() passes index to selector", () => {
  const array = [10, 20, 30];

  const actual = averageOf(array, (_, index) => index * 10);

  assertEquals(actual, 10);
});

Deno.test("averageOf() handles decimal results", () => {
  const array = [1, 2];

  const actual = averageOf(array, (i) => i);

  assertEquals(actual, 1.5);
});
