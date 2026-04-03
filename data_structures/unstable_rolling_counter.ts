// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * A serializable snapshot of a {@linkcode RollingCounter}'s state.
 *
 * Obtain one via {@linkcode RollingCounter.prototype.toJSON | `toJSON`} and
 * restore it with {@linkcode RollingCounter.from}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface RollingCounterSnapshot {
  /** Segment counts ordered from oldest to newest. */
  segments: number[];
}

/**
 * A fixed-size rolling counter.
 *
 * The counter splits a window into a fixed number of segments, each tracking
 * a count. It has no built-in clock. Call
 * {@linkcode RollingCounter.prototype.rotate | `rotate`} to advance the
 * window on your own schedule.
 *
 * The class is iterable and yields segment counts from oldest to newest.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @example Usage
 * ```ts
 * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
 * import { assertEquals } from "@std/assert";
 *
 * // 3 segments, all starting at zero
 * const counter = new RollingCounter(3);
 *
 * // Add 5 to the current (newest) segment
 * counter.increment(5);
 * assertEquals(counter.total, 5);
 * assertEquals([...counter], [0, 0, 5]);
 *
 * // Advance the window, then add 3 to the new segment
 * counter.rotate();
 * counter.increment(3);
 * assertEquals(counter.total, 8);
 * assertEquals([...counter], [0, 5, 3]);
 *
 * // Bulk-rotate 2 steps: evicts the two oldest (0 and 5)
 * counter.rotate(2);
 * assertEquals(counter.total, 3);
 * assertEquals([...counter], [3, 0, 0]);
 * ```
 */
export class RollingCounter {
  #segments: number[];
  #cursor: number;
  #total: number;

  /**
   * Creates a counter with the given number of segments, all starting at zero.
   *
   * @param segmentCount The number of segments. Must be a positive integer.
   */
  constructor(segmentCount: number) {
    if (
      !Number.isInteger(segmentCount) || segmentCount < 1
    ) {
      throw new RangeError(
        `Cannot create RollingCounter: segmentCount must be a positive integer, got ${segmentCount}`,
      );
    }
    this.#segments = new Array<number>(segmentCount).fill(0);
    this.#cursor = segmentCount - 1;
    this.#total = 0;
  }

  /**
   * Creates a counter from a snapshot previously obtained via
   * {@linkcode RollingCounter.prototype.toJSON | `toJSON`}. The snapshot's
   * `segments` array defines both the number of segments and their initial
   * values, ordered oldest to newest (matching iteration order). The last
   * element is the current (newest) segment.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @param snapshot A snapshot previously obtained from `toJSON`.
   * @returns A new `RollingCounter` with the given state.
   *
   * @example Round-trip serialization
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const original = new RollingCounter(3);
   * original.increment(5);
   * original.rotate();
   * original.increment(3);
   *
   * const snapshot = original.toJSON();
   * const restored = RollingCounter.from(snapshot);
   *
   * assertEquals([...restored], [...original]);
   * assertEquals(restored.total, original.total);
   * assertEquals(restored.segmentCount, original.segmentCount);
   * ```
   */
  static from(snapshot: { segments: readonly number[] }): RollingCounter {
    const { segments } = snapshot;
    if (!Array.isArray(segments) || segments.length < 1) {
      throw new RangeError(
        "Cannot restore RollingCounter: segments must be a non-empty array",
      );
    }
    const counter = new RollingCounter(segments.length);
    for (let i = 0; i < segments.length; i++) {
      const v = segments[i]!;
      if (!Number.isInteger(v) || v < 0) {
        throw new RangeError(
          `Cannot restore RollingCounter: segment[${i}] must be a non-negative integer, got ${v}`,
        );
      }
      counter.#segments[i] = v;
      counter.#total += v;
    }
    return counter;
  }

  /**
   * Adds `n` to the current segment.
   *
   * @param n The amount to add. Defaults to `1`. Must be a non-negative integer.
   * @returns The new total across all segments.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * const total = counter.increment(5);
   * assertEquals(total, 5);
   * ```
   */
  increment(n: number = 1): number {
    if (!Number.isInteger(n) || n < 0) {
      throw new RangeError(
        `Cannot increment RollingCounter: n must be a non-negative integer, got ${n}`,
      );
    }
    this.#segments[this.#cursor]! += n;
    this.#total += n;
    return this.#total;
  }

  /**
   * Advances the window by `steps`, dropping the oldest segments. If `steps`
   * is at least {@linkcode segmentCount}, all segments are cleared.
   *
   * @param steps How many steps to advance. Defaults to `1`. Must be a
   * non-negative integer.
   * @returns The sum of the counts that were removed.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(2);
   * counter.increment(10);
   * counter.rotate();
   * const evicted = counter.rotate();
   * assertEquals(evicted, 10);
   * ```
   *
   * @example Bulk rotation
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * counter.increment(5);
   * counter.rotate();
   * counter.increment(3);
   *
   * const evicted = counter.rotate(2);
   * assertEquals(evicted, 5);
   * assertEquals(counter.total, 3);
   * ```
   */
  rotate(steps: number = 1): number {
    if (!Number.isInteger(steps) || steps < 0) {
      throw new RangeError(
        `Cannot rotate RollingCounter: steps must be a non-negative integer, got ${steps}`,
      );
    }
    const segs = this.#segments;
    const len = segs.length;
    if (steps >= len) {
      const evicted = this.#total;
      segs.fill(0);
      this.#cursor = (this.#cursor + steps) % len;
      this.#total = 0;
      return evicted;
    }

    let pos = this.#cursor + 1;
    if (pos >= len) pos = 0;

    let evicted = 0;
    const end = pos + steps;

    if (end <= len) {
      for (let i = pos; i < end; i++) {
        evicted += segs[i]!;
        segs[i] = 0;
      }
    } else {
      for (let i = pos; i < len; i++) {
        evicted += segs[i]!;
        segs[i] = 0;
      }
      const wrap = end - len;
      for (let i = 0; i < wrap; i++) {
        evicted += segs[i]!;
        segs[i] = 0;
      }
    }

    let newCursor = pos + steps - 1;
    if (newCursor >= len) newCursor -= len;
    this.#cursor = newCursor;
    this.#total -= evicted;
    return evicted;
  }

  /**
   * The count in the current (newest) segment.
   *
   * @returns The count in the current segment.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * counter.increment(5);
   * assertEquals(counter.current, 5);
   *
   * counter.rotate();
   * assertEquals(counter.current, 0);
   *
   * counter.increment(3);
   * assertEquals(counter.current, 3);
   * ```
   */
  get current(): number {
    return this.#segments[this.#cursor]!;
  }

  /**
   * The sum of all segment counts.
   *
   * @returns The sum of all segment counts.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * counter.increment(5);
   * counter.rotate();
   * counter.increment(3);
   * assertEquals(counter.total, 8);
   * ```
   */
  get total(): number {
    return this.#total;
  }

  /**
   * The number of segments in the window.
   *
   * @returns The number of segments.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(5);
   * assertEquals(counter.segmentCount, 5);
   * ```
   */
  get segmentCount(): number {
    return this.#segments.length;
  }

  /**
   * Resets all segments to zero, as if the counter were just created.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * counter.increment(10);
   * counter.clear();
   * assertEquals(counter.total, 0);
   * ```
   */
  clear(): void {
    this.#segments.fill(0);
    this.#cursor = this.#segments.length - 1;
    this.#total = 0;
  }

  /**
   * Returns a serializable snapshot of the counter state. The `segments`
   * array is ordered oldest to newest (matching iteration order), so the
   * last element is the current segment.
   *
   * The snapshot is compatible with `JSON.stringify` and can be restored
   * with {@linkcode RollingCounter.from}.
   *
   * @experimental **UNSTABLE**: New API, yet to be vetted.
   *
   * @returns A plain-object snapshot of the counter.
   *
   * @example JSON round-trip
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * counter.increment(5);
   *
   * const json = JSON.stringify(counter);
   * const restored = RollingCounter.from(JSON.parse(json));
   * assertEquals(restored.total, 5);
   * ```
   */
  toJSON(): RollingCounterSnapshot {
    const segs = this.#segments;
    const len = segs.length;
    let start = this.#cursor + 1;
    if (start >= len) start = 0;
    const result = new Array<number>(len);
    const firstLen = len - start;
    for (let i = 0; i < firstLen; i++) result[i] = segs[start + i]!;
    for (let i = 0; i < start; i++) result[firstLen + i] = segs[i]!;
    return { segments: result };
  }

  /**
   * Yields segment counts from oldest to newest.
   *
   * @returns An iterator over segment counts.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * counter.increment(5);
   * counter.rotate();
   * counter.increment(3);
   * assertEquals([...counter], [0, 5, 3]);
   * ```
   */
  *[Symbol.iterator](): IterableIterator<number> {
    const len = this.#segments.length;
    for (let i = 1; i <= len; i++) {
      yield this.#segments[(this.#cursor + i) % len]!;
    }
  }

  /**
   * The string tag used by `Object.prototype.toString`.
   *
   * @returns `"RollingCounter"`.
   *
   * @example Usage
   * ```ts
   * import { RollingCounter } from "@std/data-structures/unstable-rolling-counter";
   * import { assertEquals } from "@std/assert";
   *
   * const counter = new RollingCounter(3);
   * assertEquals(
   *   Object.prototype.toString.call(counter),
   *   "[object RollingCounter]",
   * );
   * ```
   */
  get [Symbol.toStringTag](): string {
    return "RollingCounter";
  }
}
