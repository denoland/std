// Copyright 2018-2025 the Deno authors. MIT license.
import { clamp } from "./clamp.ts";
import { assert, assertEquals, assertThrows } from "@std/assert";

Deno.test("clamp()", async (t) => {
  await t.step("basic functionality", () => {
    assertEquals(clamp(5, [1, 10]), 5);
    assertEquals(clamp(-5, [1, 10]), 1);
    assertEquals(clamp(15, [1, 10]), 10);
  });

  await t.step("NaN", () => {
    assertEquals(clamp(NaN, [0, 1]), NaN);
    assertEquals(clamp(0, [NaN, 0]), NaN);
    assertEquals(clamp(0, [0, NaN]), NaN);
  });

  await t.step("infinities", () => {
    assertEquals(clamp(5, [0, Infinity]), 5);
    assertEquals(clamp(-5, [-Infinity, 10]), -5);
  });

  await t.step("+/-0", () => {
    assert(Object.is(clamp(0, [0, 1]), 0));
    assert(Object.is(clamp(-0, [-0, 1]), -0));

    assert(Object.is(clamp(-2, [0, 1]), 0));
    assert(Object.is(clamp(-2, [-0, 1]), -0));
    assert(Object.is(clamp(2, [-1, 0]), 0));
    assert(Object.is(clamp(2, [-1, -0]), -0));

    assert(Object.is(clamp(-0, [0, 1]), 0));
    assert(Object.is(clamp(0, [-0, 1]), 0));

    assert(Object.is(clamp(-0, [-1, 0]), -0));
    assert(Object.is(clamp(0, [-1, -0]), -0));
  });

  await t.step("errors", () => {
    assertThrows(
      () => clamp(5, [10, 1]),
      RangeError,
      "`min` must be less than or equal to `max`",
    );
  });
});
