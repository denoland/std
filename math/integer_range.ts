// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Options for {@linkcode integerRange}.
 */
export type IntegerRangeOptions = {
  /**
   * The step between each number in the range.
   * @default {1}
   */
  step?: number;
  /**
   * Whether to include the start value in the range.
   * @default {true}
   */
  includeStart?: boolean;
  /**
   * Whether to include the end value in the range.
   * @default {false}
   */
  includeEnd?: boolean;
};

/**
 * Creates a generator that yields integers in a range from `start` to `end`.
 *
 * Using the default options, yielded numbers are in the interval `[start, end)` with step size `1`.
 *
 * @param start The start of the range (inclusive by default)
 * @param end The end of the range (exclusive by default)
 * @param options Options for the range
 * @returns A generator yielding integers in the specified range
 *
 * @example Usage
 * ```ts
 * import { integerRange } from "@std/math/integer-range";
 * import { assertEquals } from "@std/assert";
 * assertEquals([...integerRange(1, 5)], [1, 2, 3, 4]);
 * assertEquals([...integerRange(1, 5, { step: 2 })], [1, 3]);
 * assertEquals(
 * 	[...integerRange(1, 5, { includeStart: false, includeEnd: true })],
 * 	[2, 3, 4, 5],
 * );
 * assertEquals([...integerRange(5, 1)], []);
 * assertEquals([...integerRange(5, 1, { step: -1 })], [5, 4, 3, 2]);
 * ```
 */
export function integerRange(
  start: number,
  end: number,
  options?: IntegerRangeOptions,
): Generator<number, undefined, undefined>;

/**
 * Creates a generator that yields integers in a range from 0 to `end`.
 *
 * Using the default options, yielded numbers are in the interval `[0, end)` with step size `1`.
 *
 * @param end The end of the range (exclusive by default)
 * @param options Options for the range
 * @returns A generator yielding integers in the specified range
 *
 * @example Usage
 * ```ts
 * import { integerRange } from "@std/math/integer-range";
 * import { assertEquals } from "@std/assert";
 * assertEquals([...integerRange(5)], [0, 1, 2, 3, 4]);
 * ```
 */
export function integerRange(
  end: number,
  options?: IntegerRangeOptions,
): Generator<number, undefined, undefined>;
// deno-lint-ignore deno-style-guide/exported-function-args-maximum
export function* integerRange(
  startOrEnd: number,
  endOrOptions?: number | IntegerRangeOptions,
  maybeOptions?: IntegerRangeOptions,
): Generator<number, undefined, undefined> {
  const hasStart = typeof endOrOptions === "number";
  const [start, end, options] = [
    hasStart ? startOrEnd : 0,
    hasStart ? endOrOptions : startOrEnd,
    hasStart ? maybeOptions : endOrOptions,
  ];

  const { step = 1, includeStart = true, includeEnd = false } = options ?? {};
  if (step === 0) throw new RangeError("`step` must not be zero");
  for (const [k, v] of Object.entries({ start, end, step })) {
    if (!Number.isSafeInteger(v)) {
      throw new RangeError(`\`${k}\` must be a safe integer`);
    }
  }

  if (start === end && !(includeStart && includeEnd)) return;

  const limitsSign = Math.sign(end - start);
  const stepSign = Math.sign(step);
  if (limitsSign !== 0 && limitsSign !== stepSign) return;

  if (includeStart) yield start;

  let i = 0;
  const delta = Math.abs(step);
  const maxDelta = Math.abs(end - start);
  for (i += delta; i < maxDelta; i += delta) yield start + (i * stepSign);

  if (includeEnd && (i * stepSign) + start === end) yield end;
}
