// Copyright 2018-2025 the Deno authors. MIT license.
import { modulo } from "./modulo.ts";
import { assert, assertEquals } from "@std/assert";
import { IntegerRange } from "./integer_range.ts";

Deno.test("modulo()", async (t) => {
  await t.step("basic functionality", async (t) => {
    for (const n of new IntegerRange(-3, 3, { includeEnd: true })) {
      const val = n * 12 + 5;
      await t.step(`modulo(${val}, 12) == 5`, () => {
        assertEquals(modulo(val, 12), 5);
      });
    }
  });

  await t.step("non-integer values", () => {
    assertEquals(modulo(5.5, 2), 1.5);
    assertEquals(modulo(-5.5, 2), 0.5);
    assertEquals(modulo(5, 0.5), 0);
    assertEquals(modulo(-5.5, 0.5), 0);
  });

  await t.step("edge cases", () => {
    assertEquals(modulo(NaN, 5), NaN);
    assertEquals(modulo(5, NaN), NaN);
    assertEquals(modulo(Infinity, 5), NaN);
    assertEquals(modulo(-Infinity, 5), NaN);
    assertEquals(modulo(5, -Infinity), 5);
    assertEquals(modulo(5, Infinity), 5);
    assertEquals(modulo(5, 0), NaN);
    assertEquals(modulo(5, -0), NaN);
    assert(Object.is(modulo(0, 5), 0));
    assert(Object.is(modulo(-0, 5), -0));
  });
});
