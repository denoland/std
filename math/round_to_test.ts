// Copyright 2018-2025 the Deno authors. MIT license.
import { roundTo } from "./round_to.ts";
import { assertEquals, assertThrows } from "@std/assert";

Deno.test("roundTo()", async (t) => {
  await t.step("basic functionality", () => {
    assertEquals(roundTo(Math.PI, 2), 3.14);
    assertEquals(roundTo(Math.PI, 3, { strategy: "ceil" }), 3.142);
    assertEquals(roundTo(Math.PI, 3, { strategy: "floor" }), 3.141);
    assertEquals(roundTo(-Math.PI, 3, { strategy: "trunc" }), -3.141);
  });

  await t.step("errors", () => {
    assertThrows(
      () => roundTo(Math.PI, -1),
      RangeError,
      "`digits` must be a non-negative integer",
    );
    assertThrows(
      () => roundTo(Math.PI, 1.5),
      RangeError,
      "`digits` must be a non-negative integer",
    );
    assertThrows(
      () => roundTo(Math.PI, NaN),
      RangeError,
      "`digits` must be a non-negative integer",
    );
    assertThrows(
      () => roundTo(Math.PI, Infinity),
      RangeError,
      "`digits` must be a non-negative integer",
    );
  });
});
