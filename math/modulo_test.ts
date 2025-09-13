// Copyright 2018-2025 the Deno authors. MIT license.
import { modulo } from "./modulo.ts";
import { assert, assertEquals } from "@std/assert";

Deno.test("modulo()", async (t) => {
  await t.step("basic functionality", async (t) => {
    for (let n = -3; n <= 3; ++n) {
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

  await t.step("parity with python `%` operator (floored modulo)", () => {
    /**
     * ```python
     * def modulo(a, b):
     *   try: return a % b
     *   except: return float("nan")
     * [(a, b, modulo(a, b)) for a in range(-3, 4) for b in range(-3, 4)]
     * ```
     */
    const cases: [a: number, b: number, result: number][] = [
      [-3, -3, 0],
      [-3, -2, -1],
      [-3, -1, 0],
      [-3, 0, NaN],
      [-3, 1, 0],
      [-3, 2, 1],
      [-3, 3, 0],
      [-2, -3, -2],
      [-2, -2, 0],
      [-2, -1, 0],
      [-2, 0, NaN],
      [-2, 1, 0],
      [-2, 2, 0],
      [-2, 3, 1],
      [-1, -3, -1],
      [-1, -2, -1],
      [-1, -1, 0],
      [-1, 0, NaN],
      [-1, 1, 0],
      [-1, 2, 1],
      [-1, 3, 2],
      [0, -3, 0],
      [0, -2, 0],
      [0, -1, 0],
      [0, 0, NaN],
      [0, 1, 0],
      [0, 2, 0],
      [0, 3, 0],
      [1, -3, -2],
      [1, -2, -1],
      [1, -1, 0],
      [1, 0, NaN],
      [1, 1, 0],
      [1, 2, 1],
      [1, 3, 1],
      [2, -3, -1],
      [2, -2, 0],
      [2, -1, 0],
      [2, 0, NaN],
      [2, 1, 0],
      [2, 2, 0],
      [2, 3, 2],
      [3, -3, 0],
      [3, -2, -1],
      [3, -1, 0],
      [3, 0, NaN],
      [3, 1, 0],
      [3, 2, 1],
      [3, 3, 0],
    ];

    for (const [a, b, result] of cases) {
      assertEquals(modulo(a, b), result, `modulo(${a}, ${b}) == ${result}`);
    }
  });
});
