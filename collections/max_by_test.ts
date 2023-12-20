// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { maxBy } from "./max_by.ts";

Deno.test("maxBy() handles array input", () => {
  const input = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const max = maxBy(input, (i) => i.age);

  assertEquals(max, { name: "John", age: 42 });
});

Deno.test("maxBy() handles array input with mutation", () => {
  const input = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const max = maxBy(input, (i) => i.age - 10);

  assertEquals(max, { name: "John", age: 42 });
});

Deno.test("maxBy() handles array input with multiple max", () => {
  const input = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const max = maxBy(input, (i) => i.age);

  assertEquals(max, { name: "John", age: 42 });
});

Deno.test("maxBy() handles array of positive numbers", () => {
  const input = [2, 3, 5];

  const max = maxBy(input, (i) => i);

  assertEquals(max, 5);
});

Deno.test("maxBy() handles array of negative numbers", () => {
  const input = [-2, -3, -5];

  const max = maxBy(input, (i: number) => i);

  assertEquals(max, -2);
});

Deno.test("maxBy() handles array of strings", () => {
  const input = ["Kyle", "John", "Anna"];

  const max = maxBy(input, (i: string) => i);

  assertEquals(max, "Kyle");
});

Deno.test("maxBy() handles of empty array", () => {
  const input: number[] = [];

  const max = maxBy(input, (i) => i);

  assertEquals(max, undefined);
});

Deno.test("maxBy() handles array of numbers with multiple max", () => {
  const input = [2, 3, 5, 5];

  const max = maxBy(input, (i) => i);

  assertEquals(max, 5);
});

Deno.test("maxBy() handles array of numbers with infinity", () => {
  const input = [2, 3, 5, Infinity];

  const max = maxBy(input, (i) => i);

  assertEquals(max, Infinity);
});

Deno.test("maxBy() handles array of numbers with NaN", () => {
  const input = [2, 3, 5, NaN];

  const max = maxBy(input, (i) => i);

  assertEquals(max, 5);
});

Deno.test("maxBy() handles no mutation", () => {
  const input = [2, 3, 5];

  maxBy(input, (i) => i);

  assertEquals(input, [2, 3, 5]);
});

Deno.test("maxBy() handles empty input", () => {
  const emptyArray: Array<{ age: number }> = [];
  const max = maxBy(emptyArray, (it) => it.age);

  assertEquals(max, undefined);
});

Deno.test({
  name: "maxBy() handles bigint",
  fn() {
    const input = [
      "9007199254740999",
      "9007199254740991",
      "9007199254740995",
    ];

    assertEquals(maxBy(input, (it) => BigInt(it)), "9007199254740999");
  },
});

Deno.test({
  name: "maxBy() handles date",
  fn() {
    const input = [
      "February 1, 2022",
      "December 17, 1995",
      "June 12, 2012",
    ];

    assertEquals(maxBy(input, (it) => new Date(it)), "February 1, 2022");
  },
});
