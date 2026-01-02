// Copyright 2018-2026 the Deno authors. MIT license.
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
    assertEquals(modulo(5, Infinity), 5);
    assertEquals(modulo(5, -Infinity), -Infinity);
    assertEquals(modulo(5, 0), NaN);
    assertEquals(modulo(5, -0), NaN);
    assert(Object.is(modulo(0, 5), 0));
    assert(Object.is(modulo(-0, 5), 0));
  });

  await t.step("parity with python `%` operator (floored modulo)", () => {
    /**
     * ```python
     * def modulo(a, b):
     *   try: return a % b
     *   except: return float("nan")
     * xs = [float('inf'), float('-inf'), float('nan'), 0.0, -0.0, 0.5, 1.0, 2.0, -0.5, -1.0, -2.0]
     * cases = [(a, b, modulo(a, b)) for a in xs for b in xs]
     * ```
     */
    const cases: [a: number, b: number, result: number][] = [
      [Infinity, Infinity, NaN],
      [Infinity, -Infinity, NaN],
      [Infinity, NaN, NaN],
      [Infinity, 0.0, NaN],
      [Infinity, -0.0, NaN],
      [Infinity, 0.5, NaN],
      [Infinity, 1.0, NaN],
      [Infinity, 2.0, NaN],
      [Infinity, -0.5, NaN],
      [Infinity, -1.0, NaN],
      [Infinity, -2.0, NaN],
      [-Infinity, Infinity, NaN],
      [-Infinity, -Infinity, NaN],
      [-Infinity, NaN, NaN],
      [-Infinity, 0.0, NaN],
      [-Infinity, -0.0, NaN],
      [-Infinity, 0.5, NaN],
      [-Infinity, 1.0, NaN],
      [-Infinity, 2.0, NaN],
      [-Infinity, -0.5, NaN],
      [-Infinity, -1.0, NaN],
      [-Infinity, -2.0, NaN],
      [NaN, Infinity, NaN],
      [NaN, -Infinity, NaN],
      [NaN, NaN, NaN],
      [NaN, 0.0, NaN],
      [NaN, -0.0, NaN],
      [NaN, 0.5, NaN],
      [NaN, 1.0, NaN],
      [NaN, 2.0, NaN],
      [NaN, -0.5, NaN],
      [NaN, -1.0, NaN],
      [NaN, -2.0, NaN],
      [0.0, Infinity, 0.0],
      [0.0, -Infinity, -0.0],
      [0.0, NaN, NaN],
      [0.0, 0.0, NaN],
      [0.0, -0.0, NaN],
      [0.0, 0.5, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 2.0, 0.0],
      [0.0, -0.5, -0.0],
      [0.0, -1.0, -0.0],
      [0.0, -2.0, -0.0],
      [-0.0, Infinity, 0.0],
      [-0.0, -Infinity, -0.0],
      [-0.0, NaN, NaN],
      [-0.0, 0.0, NaN],
      [-0.0, -0.0, NaN],
      [-0.0, 0.5, 0.0],
      [-0.0, 1.0, 0.0],
      [-0.0, 2.0, 0.0],
      [-0.0, -0.5, -0.0],
      [-0.0, -1.0, -0.0],
      [-0.0, -2.0, -0.0],
      [0.5, Infinity, 0.5],
      [0.5, -Infinity, -Infinity],
      [0.5, NaN, NaN],
      [0.5, 0.0, NaN],
      [0.5, -0.0, NaN],
      [0.5, 0.5, 0.0],
      [0.5, 1.0, 0.5],
      [0.5, 2.0, 0.5],
      [0.5, -0.5, -0.0],
      [0.5, -1.0, -0.5],
      [0.5, -2.0, -1.5],
      [1.0, Infinity, 1.0],
      [1.0, -Infinity, -Infinity],
      [1.0, NaN, NaN],
      [1.0, 0.0, NaN],
      [1.0, -0.0, NaN],
      [1.0, 0.5, 0.0],
      [1.0, 1.0, 0.0],
      [1.0, 2.0, 1.0],
      [1.0, -0.5, -0.0],
      [1.0, -1.0, -0.0],
      [1.0, -2.0, -1.0],
      [2.0, Infinity, 2.0],
      [2.0, -Infinity, -Infinity],
      [2.0, NaN, NaN],
      [2.0, 0.0, NaN],
      [2.0, -0.0, NaN],
      [2.0, 0.5, 0.0],
      [2.0, 1.0, 0.0],
      [2.0, 2.0, 0.0],
      [2.0, -0.5, -0.0],
      [2.0, -1.0, -0.0],
      [2.0, -2.0, -0.0],
      [-0.5, Infinity, Infinity],
      [-0.5, -Infinity, -0.5],
      [-0.5, NaN, NaN],
      [-0.5, 0.0, NaN],
      [-0.5, -0.0, NaN],
      [-0.5, 0.5, 0.0],
      [-0.5, 1.0, 0.5],
      [-0.5, 2.0, 1.5],
      [-0.5, -0.5, -0.0],
      [-0.5, -1.0, -0.5],
      [-0.5, -2.0, -0.5],
      [-1.0, Infinity, Infinity],
      [-1.0, -Infinity, -1.0],
      [-1.0, NaN, NaN],
      [-1.0, 0.0, NaN],
      [-1.0, -0.0, NaN],
      [-1.0, 0.5, 0.0],
      [-1.0, 1.0, 0.0],
      [-1.0, 2.0, 1.0],
      [-1.0, -0.5, -0.0],
      [-1.0, -1.0, -0.0],
      [-1.0, -2.0, -1.0],
      [-2.0, Infinity, Infinity],
      [-2.0, -Infinity, -2.0],
      [-2.0, NaN, NaN],
      [-2.0, 0.0, NaN],
      [-2.0, -0.0, NaN],
      [-2.0, 0.5, 0.0],
      [-2.0, 1.0, 0.0],
      [-2.0, 2.0, 0.0],
      [-2.0, -0.5, -0.0],
      [-2.0, -1.0, -0.0],
      [-2.0, -2.0, -0.0],
    ];

    for (const [a, b, result] of cases) {
      const actual = modulo(a, b);
      assert(
        Object.is(actual, result),
        `modulo(${Deno.inspect(a)}, ${Deno.inspect(b)}) == ${
          Deno.inspect(result)
        } (actual ${Deno.inspect(actual)})`,
      );
    }
  });
});
