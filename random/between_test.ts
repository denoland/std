// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { randomBetween, randomIntegerBetween } from "./between.ts";
import { PCG32_INITIALIZER, SeededRandom } from "./seeded.ts";
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertGreaterOrEqual,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";

Deno.test("randomBetween() generates a random number between the provided minimum and maximum values", () => {
  const { random } = SeededRandom.fromState(PCG32_INITIALIZER);
  const results = Array.from(
    { length: 1e4 },
    () => randomBetween(1, 10, { random }),
  );

  const min = Math.min(...results);
  const max = Math.max(...results);

  assertGreaterOrEqual(min, 1);
  assertLessOrEqual(max, 10);
  assertAlmostEquals(min, 1, 0.01);
  assertAlmostEquals(max, 10, 0.01);

  const avg = results.reduce((sum, n) => sum + n, 0) / results.length;
  assertAlmostEquals(avg, 5.5, 0.1);
});

Deno.test("randomBetween() throws if min or max are NaN", () => {
  assertThrows(() => randomBetween(NaN, 1), RangeError);
  assertThrows(() => randomBetween(1, NaN), RangeError);
});

Deno.test("randomBetween() throws if max is less than min", () => {
  assertThrows(() => randomBetween(10, 1), RangeError);
});

Deno.test("randomBetween() allows negative min and max", () => {
  const { random } = SeededRandom.fromState(PCG32_INITIALIZER);
  const results = Array.from(
    { length: 3 },
    () => randomBetween(-10, -1, { random }),
  );

  assertEquals(results, [
    -9.255586388288066,
    -9.912607186706737,
    -2.862219122471288,
  ]);
});

Deno.test("randomBetween() allows non-integer min and max", () => {
  const { random } = SeededRandom.fromState(PCG32_INITIALIZER);
  const results = Array.from(
    { length: 3 },
    () => randomBetween(1.5, 2.5, { random }),
  );

  assertEquals(results, [
    1.5827126235235482,
    1.5097103125881404,
    2.293086764169857,
  ]);
});

Deno.test("randomBetween() allows min and max to be the same, in which case it returns constant values", () => {
  const results = Array.from({ length: 3 }, () => randomBetween(9.99, 9.99));
  assertEquals(results, [9.99, 9.99, 9.99]);
});

Deno.test("randomIntegerBetween() generates a random integer between the provided minimum and maximum values", () => {
  const { random } = SeededRandom.fromState(PCG32_INITIALIZER);
  const results = Array.from(
    { length: 1e4 },
    () => randomIntegerBetween(1, 10, { random }),
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
  assertThrows(() => randomIntegerBetween(NaN, 1), RangeError);
  assertThrows(() => randomIntegerBetween(1, NaN), RangeError);
});

Deno.test("randomIntegerBetween() throws if max is less than min", () => {
  assertThrows(() => randomIntegerBetween(10, 1), RangeError);
});

Deno.test("randomIntegerBetween() allows negative min and max", () => {
  const { random } = SeededRandom.fromState(PCG32_INITIALIZER);
  const results = Array.from(
    { length: 3 },
    () => randomIntegerBetween(-10, -1, { random }),
  );

  assertEquals(results, [-10, -10, -3]);
});

Deno.test("randomIntegerBetween() throws on non-integer min and max", () => {
  assertThrows(() => randomIntegerBetween(1.1, 10), RangeError);
  assertThrows(() => randomIntegerBetween(1, 10.1), RangeError);
});

Deno.test("randomIntegerBetween() allows min and max to be the same, in which case it returns constant values", () => {
  const results = Array.from({ length: 3 }, () => randomIntegerBetween(99, 99));
  assertEquals(results, [99, 99, 99]);
});
