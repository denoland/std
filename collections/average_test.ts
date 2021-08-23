// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { average } from "./average.ts";

Deno.test("[collections/average] empty array", () => {
  const input: Array<number> = [];

  const actual = average(input);

  assertEquals(actual, undefined);
});

Deno.test("[collections/average] array with single element", () => {
  const input = [0];

  const actual = average(input);

  assertEquals(actual, 0);
});

Deno.test("[collections/average] array with positive numbers", () => {
  const input = [1, 2, 3, 4, 5];

  const actual = average(input);

  assertEquals(actual, 3);
});

Deno.test("[collections/average] array with negative numbers", () => {
  const input = [-1, -2, -3, -4, -5];

  const actual = average(input);

  assertEquals(actual, -3);
});

Deno.test("[collections/average] array with NaN", () => {
  const input = [1, 2, 3, 4, 5, NaN];

  const actual = average(input);

  assertEquals(actual, NaN);
});

Deno.test("[collections/average] array with Infinity", () => {
  const input = [1, 2, 3, 4, 5, Infinity];

  const actual = average(input);

  assertEquals(actual, Infinity);
});

Deno.test("[collections/average] array with duplicate numbers", () => {
  const input = [1, 1, 1, 1, 1];

  const actual = average(input);

  assertEquals(actual, 1);
});
