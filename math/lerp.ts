// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Performs linear interpolation between two values.
 *
 * `t` outside the range `[0, 1]` extrapolates beyond the endpoints. A `t` of
 * `0` returns `a` exactly and a `t` of `1` returns `b` exactly, even when
 * floating point rounding would otherwise cause `a + (b - a)` to differ from
 * `b`.
 *
 * @param a The start value
 * @param b The end value
 * @param t The interpolation parameter (`0` returns `a`, `1` returns `b`)
 * @returns The interpolated value
 *
 * @example Usage
 * ```ts
 * import { lerp } from "@std/math/lerp";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(lerp(0, 10, 0.5), 5);
 * assertEquals(lerp(0, 10, 0), 0);
 * assertEquals(lerp(0, 10, 1), 10);
 * ```
 */
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export function lerp(a: number, b: number, t: number): number {
  if (t === 0) return a;
  if (t === 1) return b;
  return a + (b - a) * t;
}
