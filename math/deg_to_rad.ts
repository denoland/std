// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Converts degrees to radians.
 *
 * @param degrees The angle in degrees
 * @returns The angle in radians
 *
 * @example Usage
 * ```ts
 * import { degToRad } from "@std/math/deg-to-rad";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(degToRad(180), Math.PI);
 * assertEquals(degToRad(90), Math.PI / 2);
 * ```
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
