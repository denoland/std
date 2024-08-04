// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { randomBetween, randomIntegerBetween } from "./between.ts";
import { SeededPrng } from "./seeded.ts";
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertGreaterOrEqual,
  AssertionError,
  assertLessOrEqual,
  assertThrows,
} from "@std/assert";

Deno.test("randomBetween() generates a random number between the provided minimum and maximum values", () => {
  const { random } = new SeededPrng(1);
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
  assertThrows(() => randomBetween(NaN, 1), AssertionError);
  assertThrows(() => randomBetween(1, NaN), AssertionError);
});

Deno.test("randomBetween() throws if max is less than min", () => {
  assertThrows(() => randomBetween(10, 1), AssertionError);
});

Deno.test("randomBetween() allows negative min and max", () => {
  const { random } = new SeededPrng(1);
  const results = Array.from(
    { length: 3 },
    () => randomBetween(-10, -1, { random }),
  );

  assertEquals(results, [
    -9.847621844203088,
    -1.9427147988580078,
    -8.996580809051931,
  ]);
});

Deno.test("randomBetween() allows non-integer min and max", () => {
  const { random } = new SeededPrng(1);
  const results = Array.from(
    { length: 3 },
    () => randomBetween(1.5, 2.5, { random }),
  );

  assertEquals(results, [
    1.5169309061996568,
    2.395253911237999,
    1.6114910212164522,
  ]);
});

Deno.test("randomBetween() allows min and max to be the same, in which case it returns constant values", () => {
  const results = Array.from({ length: 3 }, () => randomBetween(9.99, 9.99));
  assertEquals(results, [9.99, 9.99, 9.99]);
});

Deno.test("randomIntegerBetween() generates a random integer between the provided minimum and maximum values", () => {
  const { random } = new SeededPrng(1);
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
  assertThrows(() => randomIntegerBetween(NaN, 1), AssertionError);
  assertThrows(() => randomIntegerBetween(1, NaN), AssertionError);
});

Deno.test("randomIntegerBetween() throws if max is less than min", () => {
  assertThrows(() => randomIntegerBetween(10, 1), AssertionError);
});

Deno.test("randomIntegerBetween() allows negative min and max", () => {
  const { random } = new SeededPrng(1);
  const results = Array.from(
    { length: 3 },
    () => randomIntegerBetween(-10, -1, { random }),
  );

  assertEquals(results, [-10, -2, -9]);
});

Deno.test("randomIntegerBetween() throws on non-integer min and max", () => {
  assertThrows(() => randomIntegerBetween(1.1, 10), AssertionError);
  assertThrows(() => randomIntegerBetween(1, 10.1), AssertionError);
});

Deno.test("randomIntegerBetween() allows min and max to be the same, in which case it returns constant values", () => {
  const results = Array.from({ length: 3 }, () => randomIntegerBetween(99, 99));
  assertEquals(results, [99, 99, 99]);
});
