// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Converts radians to degrees.
 *
 * @param radians The angle in radians
 * @returns The angle in degrees
 *
 * @example Usage
 * ```ts
 * import { radToDeg } from "@std/math/rad-to-deg";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(radToDeg(Math.PI), 180);
 * assertEquals(radToDeg(Math.PI / 2), 90);
 * ```
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}
