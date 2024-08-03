// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { randomBetween, randomIntegerBetween } from "./between.ts";
import { SeededPrng } from "./seeded.ts";
import { assert, assertAlmostEquals, assertEquals } from "@std/assert";

Deno.test("randomBetween() generates a random number between the provided minimum and maximum values", () => {
  const { random } = new SeededPrng(1);
  const results = Array.from(
    { length: 1000 },
    () => randomBetween(1, 10, { random }),
  );

  assertAlmostEquals(Math.min(...results), 1, 0.1);
  assertAlmostEquals(Math.max(...results), 10, 0.1);
});

Deno.test("randomIntegerBetween() generates a random integer between the provided minimum and maximum values", () => {
  const { random } = new SeededPrng(1);
  const results = Array.from(
    { length: 1000 },
    () => randomIntegerBetween(1, 10, { random }),
  );

  assertEquals(Math.min(...results), 1);
  assertEquals(Math.max(...results), 10);

  for (let i = 1; i <= 10; ++i) {
    assert(results.includes(i));
  }
});
