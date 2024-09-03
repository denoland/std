// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { randomIntegerBetween } from "./integer_between.ts";
import { randomSeeded } from "./seeded.ts";
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertThrows,
} from "@std/assert";

Deno.test("randomIntegerBetween() generates a random integer between the provided minimum and maximum values", () => {
  const prng = randomSeeded(0n);

  const results = Array.from(
    { length: 1e4 },
    () => randomIntegerBetween(1, 10, { prng }),
  );

  assertEquals(Math.min(...results), 1);
  assertEquals(Math.max(...results), 10);

  for (let i = 1; i <= 10; ++i) {
    assert(results.includes(i));
  }

  const avg = results.reduce((sum, n) => sum + n, 0) / results.length;
  assertAlmostEquals(avg, 5.5, 0.1);
});

Deno.test("randomIntegerBetween() throws if min or max are NaN", () => {
  assertThrows(
    () => randomIntegerBetween(NaN, 1),
    RangeError,
    "min and max must be finite",
  );
  assertThrows(
    () => randomIntegerBetween(1, NaN),
    RangeError,
    "min and max must be finite",
  );
});

Deno.test("randomIntegerBetween() throws if min or max are +/-Infinity", () => {
  assertThrows(
    () => randomIntegerBetween(-Infinity, 1),
    RangeError,
    "min and max must be finite",
  );
  assertThrows(
    () => randomIntegerBetween(1, Infinity),
    RangeError,
    "min and max must be finite",
  );
});

Deno.test("randomIntegerBetween() throws if max is less than min", () => {
  assertThrows(
    () => randomIntegerBetween(10, 1),
    RangeError,
    "max must be greater than or equal to min",
  );
});

Deno.test("randomIntegerBetween() allows negative min and max", () => {
  const prng = randomSeeded(1n);
  const results = Array.from(
    { length: 3 },
    () => randomIntegerBetween(-10, -1, { prng }),
  );

  assertEquals(results, [-8, -6, -3]);
});

Deno.test(
  "randomIntegerBetween() returns evenly-distributed values in [ceil(min), floor(max)] for non-integer min and max",
  () => {
    const prng = randomSeeded(1n);
    const getRand = () => randomIntegerBetween(-0.001, 1.999, { prng });
    const length = 1000;
    const results = Array.from({ length }, () => getRand());

    const { 0: zeroes = [], 1: ones = [] } = Object.values(
      Object.groupBy(results, (result) => Math.floor(result)),
    );

    assertAlmostEquals(zeroes.length, length / 2, length / 10);
    assertAlmostEquals(ones.length, length / 2, length / 10);
  },
);

Deno.test("randomIntegerBetween() allows min and max to be the same, in which case it returns constant values", () => {
  const results = Array.from({ length: 3 }, () => randomIntegerBetween(99, 99));
  assertEquals(results, [99, 99, 99]);
});
