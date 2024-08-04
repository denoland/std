// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { randomBetween, randomIntegerBetween } from "./between.ts";
import { SeededPrng } from "./seeded.ts";
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertGreaterOrEqual,
  assertLessOrEqual,
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
