// Copyright 2018-2025 the Deno authors. MIT license.
import { nextFloat64 } from "./number_types.ts";
import { type ByteGenerator, byteGeneratorSeeded } from "./seeded.ts";
import { assertEquals, assertGreaterOrEqual, assertLess } from "@std/assert";

Deno.test("nextFloat64() gets floats from a seeded byte generator", () => {
  const byteGenerator = byteGeneratorSeeded(1n);
  assertEquals(nextFloat64(byteGenerator), 0.49116444173310125);
  assertEquals(nextFloat64(byteGenerator), 0.06903754193160427);
  assertEquals(nextFloat64(byteGenerator), 0.16063206851777034);
});

Deno.test("nextFloat64() gets floats that are always in the [0, 1) range", () => {
  const zeroValueGenerator: ByteGenerator = (b) => b.fill(0);
  assertEquals(nextFloat64(zeroValueGenerator), 0);

  const maxValueGenerator: ByteGenerator = (b) => b.fill(-1);
  assertEquals(nextFloat64(maxValueGenerator), 0.9999999999999999);

  const val = nextFloat64(crypto.getRandomValues.bind(crypto));

  assertGreaterOrEqual(val, 0);
  assertLess(val, 1);
});
