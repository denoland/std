// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.
import { copy } from "./copy.ts";
import type { Uint8Array_ } from "./_types.ts";
// deno-lint-ignore deno-std-docs/exported-symbol-documented
export type { Uint8Array_ };

/**
 * Returns a new byte slice composed of `count` repetitions of the `source`
 * array.
 *
 * @param source Source array to repeat.
 * @param count Number of times to repeat the source array.
 * @returns A new byte slice composed of `count` repetitions of the `source`
 * array.
 *
 * @example Basic usage
 * ```ts
 * import { repeat } from "@std/bytes/repeat";
 * import { assertEquals } from "@std/assert";
 *
 * const source = new Uint8Array([0, 1, 2]);
 *
 * assertEquals(repeat(source, 3), new Uint8Array([0, 1, 2, 0, 1, 2, 0, 1, 2]));
 * ```
 *
 * @example Zero count
 * ```ts
 * import { repeat } from "@std/bytes/repeat";
 * import { assertEquals } from "@std/assert";
 *
 * const source = new Uint8Array([0, 1, 2]);
 *
 * assertEquals(repeat(source, 0), new Uint8Array());
 * ```
 */
export function repeat(source: Uint8Array, count: number): Uint8Array_ {
  if (count < 0 || !Number.isInteger(count)) {
    throw new RangeError("Count must be a non-negative integer");
  }

  const repeated = new Uint8Array(source.length * count);
  let offset = 0;

  while (offset < repeated.length) {
    offset += copy(source, repeated, offset);
  }

  return repeated;
}
