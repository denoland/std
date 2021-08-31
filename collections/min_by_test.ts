// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { minBy } from "./min_by.ts";

Deno.test("[collections/minBy] of array of input", () => {
  const input = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const min = minBy(input, (i) => i.age);

  assertEquals(min, { name: "Anna", age: 23 });
});

Deno.test("[collections/minBy] of array of input with mutation", () => {
  const input = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
  ];

  const min = minBy(input, (i) => i.age - 10);

  assertEquals(min, { name: "Anna", age: 23 });
});

Deno.test("[collections/minBy] of array of input with multiple min", () => {
  const input = [
    { name: "Kyle", age: 34 },
    { name: "John", age: 42 },
    { name: "Anna", age: 23 },
    { name: "Anna", age: 23 },
  ];

  const min = minBy(input, (i) => i.age);

  assertEquals(min, { name: "Anna", age: 23 });
});

Deno.test("[collections/minBy] of array of positive numbers", () => {
  const input = [2, 3, 5];

  const min = minBy(input, (i) => i);

  assertEquals(min, 2);
});

Deno.test("[collections/minBy] of array of negative numbers", () => {
  const input = [-2, -3, -5];

  const min = minBy(input, (i) => i);

  assertEquals(min, -5);
});

Deno.test("[collections/minBy] of array of strings", () => {
  const input = ["Kyle", "John", "Anna"];

  const min = minBy(input, (i: string) => i);

  assertEquals(min, "Anna");
});

Deno.test("[collections/minBy] of empty array", () => {
  const input: number[] = [];

  const min = minBy(input, (i) => i);

  assertEquals(min, undefined);
});

Deno.test("[collections/minBy] of array of numbers with multiple min", () => {
  const input = [2, 3, 5, 5];

  const min = minBy(input, (i) => i);

  assertEquals(min, 2);
});

Deno.test("[collections/minBy] of array of numbers with infinity", () => {
  const input = [2, 3, 5, -Infinity];

  const min = minBy(input, (i: number) => i);

  assertEquals(min, -Infinity);
});

Deno.test("[collections/minBy] of array of numbers with NaN", () => {
  const input = [2, 3, 5, NaN];

  const min = minBy(input, (i) => i);

  assertEquals(min, 2);
});

Deno.test("[collections/minBy] no mutation", () => {
  const input = [2, 3, 5, NaN];

  minBy(input, (i: number) => i);

  assertEquals(input, [2, 3, 5, NaN]);
});

Deno.test("[collections/minBy] empty input", () => {
  const input: Array<{ age: number }> = [];

  const min = minBy(input, (i) => i.age);

  assertEquals(min, undefined);
});
