// Copyright 2018-2025 the Deno authors. MIT license.
import {
  getRandomValuesSeeded,
  type RandomValueGenerator,
} from "./get_random_values_seeded.ts";
import { nextFloat64 } from "./next_float_64.ts";
import { assertEquals, assertGreaterOrEqual, assertLess } from "@std/assert";

Deno.test("nextFloat64() gets floats from a seeded value generator", () => {
  const getRandomValues = getRandomValuesSeeded(1n);
  assertEquals(nextFloat64(getRandomValues), 0.49116444173310125);
  assertEquals(nextFloat64(getRandomValues), 0.06903754193160427);
  assertEquals(nextFloat64(getRandomValues), 0.16063206851777034);
});

Deno.test("nextFloat64() gets floats that are always in the [0, 1) range", () => {
  // deno-lint-ignore no-explicit-any
  const zeroValueGenerator: RandomValueGenerator = (b) => (b as any).fill(0);
  assertEquals(nextFloat64(zeroValueGenerator), 0);

  // deno-lint-ignore no-explicit-any
  const maxValueGenerator: RandomValueGenerator = (b) => (b as any).fill(-1);
  assertEquals(nextFloat64(maxValueGenerator), 0.9999999999999999);

  const val = nextFloat64(crypto.getRandomValues.bind(crypto));

  assertGreaterOrEqual(val, 0);
  assertLess(val, 1);
});
