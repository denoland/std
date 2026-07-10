// Copyright 2018-2026 the Deno authors. MIT license.
import { assert, assertEquals, assertThrows } from "@std/assert";
import { randomInt } from "./random_int.ts";

Deno.test("randomInt() returns a value within the range", () => {
  for (let i = 0; i < 100; i++) {
    const val = randomInt(1, 6);
    assert(val >= 1 && val <= 6);
  }
});

Deno.test("randomInt() returns min when min == max", () => {
  assertEquals(randomInt(5, 5), 5);
});

Deno.test("randomInt() returns integers only", () => {
  for (let i = 0; i < 100; i++) {
    const val = randomInt(0, 10);
    assert(Number.isInteger(val));
  }
});

Deno.test("randomInt() throws on non-integer arguments", () => {
  assertThrows(
    () => randomInt(1.5, 5),
    RangeError,
    "`min` and `max` must be integers",
  );
  assertThrows(
    () => randomInt(1, 5.5),
    RangeError,
    "`min` and `max` must be integers",
  );
});

Deno.test("randomInt() throws when min > max", () => {
  assertThrows(
    () => randomInt(10, 1),
    RangeError,
    "`min` must be less than or equal to `max`",
  );
});
