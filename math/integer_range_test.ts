// Copyright 2018-2025 the Deno authors. MIT license.
import { IntegerRange } from "@std/math/integer-range";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("new IntegerRange()", async (t) => {
  await t.step("basic", () => {
    const range = new IntegerRange(1, 5);
    assertEquals([...range], [1, 2, 3, 4]);
    // can be re-consumed multiple times
    assertEquals([...range], [1, 2, 3, 4]);

    const iter = range[Symbol.iterator]();
    assertEquals([...iter], [1, 2, 3, 4]);
    // already consumed, yields nothing
    assertEquals([...iter], []);
  });

  await t.step("only include end (start defaulting to `0`)", () => {
    const range = new IntegerRange(5);
    assertEquals([...range], [0, 1, 2, 3, 4]);
  });

  await t.step("`step`", () => {
    assertEquals([...new IntegerRange(1, 5).step(2)], [1, 3]);
  });

  await t.step("`includeEnd`", () => {
    assertEquals(
      [...new IntegerRange(1, 5, { includeEnd: true })],
      [1, 2, 3, 4, 5],
    );
  });

  await t.step(
    "`start` and `end` in opposite order to `step` yield no results",
    () => {
      assertEquals([...new IntegerRange(5, 1)], []);
      assertEquals([...new IntegerRange(1, 5).step(-1)], []);
    },
  );

  await t.step("decreasing range with negative step", () => {
    assertEquals([...new IntegerRange(5, 1).step(-1)], [5, 4, 3, 2]);
  });

  await t.step("`start` == `end`", () => {
    assertEquals([...new IntegerRange(0, 0)], []);
    // only yield anything if `includeEnd` is `true`
    assertEquals([...new IntegerRange(0, 0, { includeEnd: true })], [0]);
  });

  await t.step("errors", () => {
    assertThrows(
      () => [...new IntegerRange(1.5, 5)],
      RangeError,
      "`start` must be a safe integer",
    );
    assertThrows(
      () => [...new IntegerRange(1, 5.5)],
      RangeError,
      "`end` must be a safe integer",
    );
    assertThrows(
      () => [...new IntegerRange(1, 5).step(1.5)],
      RangeError,
      "`step` must be a safe, non-zero integer",
    );

    assertThrows(
      () => [...new IntegerRange(1, 5).step(0)],
      RangeError,
      "`step` must be a safe, non-zero integer",
    );
  });

  await t.step("`includeEnd` with `step`", () => {
    assertEquals([...new IntegerRange(0, 2).step(2)], [0]),
      assertEquals(
        [...new IntegerRange(0, 2, { includeEnd: true }).step(2)],
        [0, 2],
      );
    assertEquals([...new IntegerRange(0, 3).step(2)], [0, 2]),
      assertEquals(
        [...new IntegerRange(0, 3, { includeEnd: true }).step(2)],
        [0, 2],
      );
  });
});
