// Copyright 2018-2026 the Deno authors. MIT license.
import { randomBetween } from "./between.ts";
import { randomSeeded } from "./seeded.ts";
import {
  assert,
  assertAlmostEquals,
  assertEquals,
  assertGreaterOrEqual,
  assertLessOrEqual,
  assertNotEquals,
  assertThrows,
} from "@std/assert";

Deno.test("randomBetween() generates a random number between the provided minimum and maximum values", () => {
  const prng = randomSeeded(0n);
  const results = Array.from(
    { length: 1e4 },
    () => randomBetween(1, 10, { prng }),
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
  assertThrows(
    () => randomBetween(NaN, 1),
    RangeError,
    "Cannot generate a random number: min cannot be NaN",
  );
  assertThrows(
    () => randomBetween(1, NaN),
    RangeError,
    "Cannot generate a random number: max cannot be NaN",
  );
});

Deno.test("randomBetween() throws if min or max are +/-Infinity", () => {
  assertThrows(
    () => randomBetween(-Infinity, 1),
    RangeError,
    "Cannot generate a random number: min cannot be -Infinity",
  );
  assertThrows(
    () => randomBetween(1, Infinity),
    RangeError,
    "Cannot generate a random number: max cannot be Infinity",
  );
});

Deno.test("randomBetween() throws if max is less than min", () => {
  assertThrows(
    () => randomBetween(10, 1),
    RangeError,
    "Cannot generate a random number as max must be greater than or equal to min: max=1, min=10",
  );
});

Deno.test("randomBetween() allows negative min and max", () => {
  const prng = randomSeeded(0n);
  const results = Array.from(
    { length: 3 },
    () => randomBetween(-10, -1, { prng }),
  );

  assertEquals(results, [
    -9.374074870022014,
    -1.1224633122328669,
    -9.295748566510156,
  ]);
});

Deno.test("randomBetween() allows non-integer min and max", () => {
  const prng = randomSeeded(0n);
  const results = Array.from(
    { length: 3 },
    () => randomBetween(1.5, 2.5, { prng }),
  );

  assertEquals(results, [
    1.5695472366642207,
    2.4863929653074592,
    1.5782501592766494,
  ]);
});

Deno.test("randomBetween() allows min and max to be the same, in which case it returns constant values", () => {
  const results = Array.from({ length: 3 }, () => randomBetween(9.99, 9.99));
  assertEquals(results, [9.99, 9.99, 9.99]);
});

Deno.test("randomBetween() never returns max, even if the prng returns its max value", () => {
  const prng = () => 0.9999999999999999;
  const result = randomBetween(1, 2, { prng });
  assertNotEquals(result, 2);
});

Deno.test("randomBetween() doesn't overflow even for min = -Number.MAX_VALUE; max = Number.MAX_VALUE", () => {
  for (const val of [0, 0.5, 0.9999999999999999]) {
    const result = randomBetween(
      -Number.MAX_VALUE,
      Number.MAX_VALUE,
      { prng: () => val! },
    );
    assert(Number.isFinite(result));
  }
});
