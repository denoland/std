// Copyright 2018-2025 the Deno authors. MIT license.
import { integerRange } from "@std/math/integer-range";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("integerRange()", async (t) => {
  await t.step("basic", () => {
    const range = integerRange(1, 5);
    assertEquals([...range], [1, 2, 3, 4]);
    // already consumed iterator
    assertEquals([...range], []);
  });

  await t.step("`step`", () => {
    assertEquals([...integerRange(1, 5, { step: 2 })], [1, 3]);
  });

  await t.step("`includeStart`, `includeEnd`", () => {
    assertEquals(
      [...integerRange(1, 5, { includeStart: false, includeEnd: true })],
      [2, 3, 4, 5],
    );
  });

  await t.step(
    "`start` and `end` in opposite order to `step` yield no results",
    () => {
      assertEquals([...integerRange(5, 1)], []);
      assertEquals([...integerRange(1, 5, { step: -1 })], []);
    },
  );

  await t.step("decreasing range with negative step", () => {
    assertEquals([...integerRange(5, 1, { step: -1 })], [5, 4, 3, 2]);
  });

  await t.step("`start` == `end`", () => {
    assertEquals([...integerRange(0, 0)], [0]);
    assertEquals([
      ...integerRange(0, 0, { includeStart: true, includeEnd: true }),
    ], [0]);
    assertEquals([
      ...integerRange(0, 0, { includeStart: false, includeEnd: true }),
    ], [0]);

    // if _both_ are false, nothing is yielded
    assertEquals([
      ...integerRange(0, 0, { includeStart: false, includeEnd: false }),
    ], []);
  });

  await t.step("errors", () => {
    assertThrows(
      () => [...integerRange(1.5, 5)],
      RangeError,
      "`start` must be a safe integer",
    );
    assertThrows(
      () => [...integerRange(1, 5, { step: 1.5 })],
      RangeError,
      "`step` must be a safe integer",
    );
    assertThrows(
      () => [...integerRange(1, 5.5)],
      RangeError,
      "`end` must be a safe integer",
    );
    assertThrows(
      () => [...integerRange(1, 5, { step: 0 })],
      RangeError,
      "`step` must not be zero",
    );
  });
});
