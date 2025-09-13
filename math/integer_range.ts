// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

/** Options for {@linkcode IntegerRange}. */
export type IntegerRangeOptions = {
  /**
   * Whether to include the end value in the range.
   * @default {false}
   */
  includeEnd?: boolean;
};

/**
 * An iterable that yields integers in a range.
 *
 * Using the default options, yielded numbers are in the interval `[start, end)`.
 *
 * @param start The start of the range (inclusive)
 * @param end The end of the range (exclusive by default)
 * @param options Options for the range
 *
 * @example Usage
 * ```ts
 * import { IntegerRange } from "@std/math/integer-range";
 * import { assertEquals } from "@std/assert";
 * assertEquals([...new IntegerRange(1, 5)], [1, 2, 3, 4]);
 * ```
 */
export class IntegerRange {
  /**
   * The start of the range.
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * const range = new IntegerRange(1, 5);
   * assertEquals(range.start, 1);
   * ```
   */
  readonly start: number;
  /**
   * The end of the range.
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * const range = new IntegerRange(1, 5);
   * assertEquals(range.end, 5);
   * ```
   */
  readonly end: number;
  /**
   * Whether the end of the range is inclusive.
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * const range = new IntegerRange(1, 5);
   * assertEquals(range.includeEnd, false);
   * ```
   */
  readonly includeEnd: boolean;

  /**
   * Creates an iterable that yields integers in a range from `start` to `end`.
   *
   * Using the default options, yielded numbers are in the interval `[start, end)`.
   *
   * @param start The start of the range (inclusive)
   * @param end The end of the range (exclusive by default)
   * @param options Options for the range
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * assertEquals([...new IntegerRange(1, 5)], [1, 2, 3, 4]);
   * ```
   */
  constructor(
    start: number,
    end: number,
    options?: IntegerRangeOptions,
  );
  /**
   * Creates an iterable that yields integers in a range from `0` to `end`.
   *
   * Using the default options, yielded numbers are in the interval `[0, end)`.
   *
   * @param end The end of the range (exclusive by default)
   * @param options Options for the range
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * assertEquals([...new IntegerRange(5)], [0, 1, 2, 3, 4]);
   * ```
   */
  constructor(end: number, options?: IntegerRangeOptions);
  constructor(
    startOrEnd: number,
    endOrOptions?: number | IntegerRangeOptions,
    maybeOptions?: IntegerRangeOptions,
  ) {
    const hasStart = typeof endOrOptions === "number";
    this.start = hasStart ? startOrEnd : 0;
    this.end = hasStart ? endOrOptions : startOrEnd;
    const options = hasStart ? maybeOptions : endOrOptions;
    this.includeEnd = options?.includeEnd ?? false;

    for (const k of ["start", "end"] as const) {
      if (!Number.isSafeInteger(this[k])) {
        throw new RangeError(`\`${k}\` must be a safe integer`);
      }
    }
  }

  /**
   * Generates numbers in the range with the default step size of 1.
   *
   * @returns A generator yielding numbers in the specified range with step size 1.
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * assertEquals([...new IntegerRange(1, 5)], [1, 2, 3, 4]);
   * assertEquals([...new IntegerRange(1, 5, { includeEnd: true })], [1, 2, 3, 4, 5]);
   * assertEquals([...new IntegerRange(5, 1)], []);
   * ```
   */
  *[Symbol.iterator](): Generator<number, undefined, undefined> {
    yield* this.step(1);
  }

  /**
   * Generates numbers in the range with the specified step size.
   *
   * @param step The step size between yielded numbers.
   * @returns A generator yielding numbers in the specified range with the given step size.
   *
   * @example Usage
   * ```ts
   * import { IntegerRange } from "@std/math/integer-range";
   * import { assertEquals } from "@std/assert";
   * assertEquals([...new IntegerRange(1, 5).step(2)], [1, 3]);
   * assertEquals([...new IntegerRange(1, 5, { includeEnd: true }).step(2)], [1, 3, 5]);
   * assertEquals([...new IntegerRange(5, 1).step(-1)], [5, 4, 3, 2]);
   * ```
   */
  *step(step: number): Generator<number, undefined, undefined> {
    if (!Number.isSafeInteger(step) || step === 0) {
      throw new RangeError("`step` must be a safe, non-zero integer");
    }

    const { start, end, includeEnd } = this;
    if (start === end && !includeEnd) return;

    const limitsSign = Math.sign(end - start);
    const stepSign = Math.sign(step);
    if (limitsSign !== 0 && limitsSign !== stepSign) return;

    let i = 0;
    const delta = Math.abs(step);
    const maxDelta = Math.abs(end - start);
    for (; i < maxDelta; i += delta) yield start + (i * stepSign);
    if (includeEnd && i === maxDelta) yield end;
  }
}
