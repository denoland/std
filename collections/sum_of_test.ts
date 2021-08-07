// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { sumOf } from "./sum_of.ts";

Deno.test("[collections/sumOf] On object properties", () => {
  const object = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const actual = sumOf(object, (i) => i.age);

  assertEquals(actual, 99);
});

Deno.test("[collections/sumOf] Add 2 to each num", () => {
  const array = [1, 2, 3];

  const actual = sumOf(array, (i) => i + 2);

  assertEquals(actual, 12);
});

Deno.test("[collections/sumOf] Regular sum", () => {
  const array = [1, 2, 3];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, 6);
});

Deno.test("[collections/sumOf] Negatives with regular sum", () => {
  const array = [-1, -2, -3];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, -6);
});

Deno.test("[collections/sumOf] Mixed negatives and positives with regular sum", () => {
  const array = [-1, 2, 3, -5];

  const actual = sumOf(array, (i) => i);

  assertEquals(actual, -1);
});

Deno.test("[collections/sumBy] Selector turns nums into negatives", () => {
  const array = [1, 3, 5, 3];

  const actual = sumOf(array, (i) => i - 6);

  assertEquals(actual, -12);
});

Deno.test("[collections/sumBy] Selector turns nums into zeros", () => {
  const array = [3, 3, 3, 3];

  const actual = sumOf(array, (i) => i - 3);

  assertEquals(actual, 0);
});

Deno.test("[collections/sumOf] On negative object properties", () => {
  const object = [
    { name: "Kyle", age: -34 },
    { name: "John", age: -42 },
    { name: "Anna", age: -23 },
  ];

  const actual = sumOf(object, (i) => i.age);

  assertEquals(actual, -99);
});

Deno.test("[collections/sumOf] On mixed object properties", () => {
  const object = [
    { name: "Kyle", age: -34 },
    { name: "John", age: 42 },
    { name: "Anna", age: -23 },
  ];

  const actual = sumOf(object, (i) => i.age);

  assertEquals(actual, -15);
});