// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { DiffResult, DiffType } from "./types.ts";

/** Represents the farthest point in the diff algorithm. */
export interface FarthestPoint {
  /** The y-coordinate of the point. */
  y: number;
  /** The id of the point. */
  id: number;
}

const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;

/**
 * Creates an array of common elements between two arrays.
 *
 * @typeParam T The type of elements in the arrays.
 *
 * @param A The first array.
 * @param B The second array.
 *
 * @returns An array containing the common elements between the two arrays.
 *
 * @example Usage
 * ```ts
 * import { createCommon } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * const a = [1, 2, 3];
 * const b = [1, 2, 4];
 *
 * assertEquals(createCommon(a, b), [1, 2]);
 * ```
 */
export function createCommon<T>(A: T[], B: T[]): T[] {
  const common: T[] = [];
  if (A.length === 0 || B.length === 0) return [];
  for (let i = 0; i < Math.min(A.length, B.length); i += 1) {
    const a = A[i];
    const b = B[i];
    if (a !== undefined && a === b) {
      common.push(a);
    } else {
      return common;
    }
  }
  return common;
}

/**
 * Asserts that the value is a {@linkcode FarthestPoint}.
 * If not, an error is thrown.
 *
 * @param value The value to check.
 *
 * @returns A void value that returns once the assertion completes.
 *
 * @example Usage
 * ```ts
 * import { assertFp } from "@std/internal/diff";
 * import { assertThrows } from "@std/assert";
 *
 * assertFp({ y: 0, id: 0 });
 * assertThrows(() => assertFp({ id: 0 }));
 * assertThrows(() => assertFp({ y: 0 }));
 * assertThrows(() => assertFp(undefined));
 * ```
 */
export function assertFp(value: unknown): asserts value is FarthestPoint {
  if (
    value == null ||
    typeof value !== "object" ||
    typeof (value as FarthestPoint)?.y !== "number" ||
    typeof (value as FarthestPoint)?.id !== "number"
  ) {
    throw new Error(
      `Unexpected value, expected 'FarthestPoint': received ${typeof value}`,
    );
  }
}

/**
 * Creates an array of backtraced differences.
 *
 * @typeParam T The type of elements in the arrays.
 *
 * @param A The first array.
 * @param B The second array.
 * @param current The current {@linkcode FarthestPoint}.
 * @param swapped Boolean indicating if the arrays are swapped.
 * @param routes The routes array.
 * @param diffTypesPtrOffset The offset of the diff types in the routes array.
 *
 * @returns An array of backtraced differences.
 *
 * @example Usage
 * ```ts
 * import { backTrace } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   backTrace([], [], { y: 0, id: 0 }, false, new Uint32Array(0), 0),
 *   [],
 * );
 * ```
 */
export function backTrace<T>(
  A: T[],
  B: T[],
  current: FarthestPoint,
  swapped: boolean,
  routes: Uint32Array,
  diffTypesPtrOffset: number,
): Array<{
  type: DiffType;
  value: T;
}> {
  const M = A.length;
  const N = B.length;
  const result: { type: DiffType; value: T }[] = [];
  let a = M - 1;
  let b = N - 1;
  let j = routes[current.id];
  let type = routes[current.id + diffTypesPtrOffset];
  while (true) {
    if (!j && !type) break;
    const prev = j!;
    if (type === REMOVED) {
      result.push({
        type: swapped ? "removed" : "added",
        value: B[b]!,
      });
      b -= 1;
    } else if (type === ADDED) {
      result.push({
        type: swapped ? "added" : "removed",
        value: A[a]!,
      });
      a -= 1;
    } else {
      result.push({ type: "common", value: A[a]! });
      a -= 1;
      b -= 1;
    }
    j = routes[prev];
    type = routes[prev + diffTypesPtrOffset];
  }
  result.reverse();
  return result;
}

/**
 * Creates a {@linkcode FarthestPoint}.
 *
 * @param k The current index.
 * @param M The length of the first array.
 * @param routes The routes array.
 * @param diffTypesPtrOffset The offset of the diff types in the routes array.
 * @param ptr The current pointer.
 * @param slide The slide {@linkcode FarthestPoint}.
 * @param down The down {@linkcode FarthestPoint}.
 *
 * @returns A {@linkcode FarthestPoint}.
 *
 * @example Usage
 * ```ts
 * import { createFp } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * assertEquals(
 *   createFp(
 *     0,
 *     0,
 *     new Uint32Array(0),
 *     0,
 *     0,
 *     { y: -1, id: 0 },
 *     { y: 0, id: 0 },
 *   ),
 *   { y: -1, id: 1 },
 * );
 * ```
 */
export function createFp(
  k: number,
  M: number,
  routes: Uint32Array,
  diffTypesPtrOffset: number,
  ptr: number,
  slide?: FarthestPoint,
  down?: FarthestPoint,
): FarthestPoint {
  if (slide && slide.y === -1 && down && down.y === -1) {
    return { y: 0, id: 0 };
  }
  const isAdding = (down?.y === -1) ||
    k === M ||
    (slide?.y ?? 0) > (down?.y ?? 0) + 1;
  if (slide && isAdding) {
    const prev = slide.id;
    ptr++;
    routes[ptr] = prev;
    routes[ptr + diffTypesPtrOffset] = ADDED;
    return { y: slide.y, id: ptr };
  }
  if (down && !isAdding) {
    const prev = down.id;
    ptr++;
    routes[ptr] = prev;
    routes[ptr + diffTypesPtrOffset] = REMOVED;
    return { y: down.y + 1, id: ptr };
  }
  throw new Error("Unexpected missing FarthestPoint");
}

/**
 * Myers stores an `(M * N)`-sized `Uint32Array`. Cap the length so comparing
 * large arrays cannot throw `RangeError` or OOM the isolate (#5942).
 * 2^26 elements is 256 MiB; typical assertion diffs stay well under this.
 */
const MAX_ROUTES_LENGTH = 2 ** 26;

function myersRoutesLength(M: number, N: number): number {
  const knuth = M + N + 1;
  if (M > 0 && N > (Number.MAX_SAFE_INTEGER - knuth - 1) / M) {
    return Infinity;
  }
  const size = (M * N + knuth + 1) * 2;
  return Number.isSafeInteger(size) ? size : Infinity;
}

/**
 * Linear fallback used when the Myers table would not fit in memory.
 * Common prefix is already stripped; a common suffix is recovered so a single
 * contiguous change still renders as one hunk.
 */
function fallbackDiff<T>(
  A: T[],
  B: T[],
  prefixCommon: T[],
  swapped: boolean,
): DiffResult<T>[] {
  const origA = swapped ? B : A;
  const origB = swapped ? A : B;
  let suffixLen = 0;
  const maxSuffix = Math.min(origA.length, origB.length);
  while (
    suffixLen < maxSuffix &&
    origA[origA.length - 1 - suffixLen] === origB[origB.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }
  const aMid = origA.slice(0, origA.length - suffixLen);
  const bMid = origB.slice(0, origB.length - suffixLen);
  const suffix = origA.slice(origA.length - suffixLen);
  return [
    ...prefixCommon.map((value) => ({ type: "common" as const, value })),
    ...aMid.map((value) => ({ type: "removed" as const, value })),
    ...bMid.map((value) => ({ type: "added" as const, value })),
    ...suffix.map((value) => ({ type: "common" as const, value })),
  ];
}

/**
 * Renders the differences between the actual and expected values.
 *
 * @typeParam T The type of elements in the arrays.
 *
 * @param A Actual value
 * @param B Expected value
 *
 * @returns An array of differences between the actual and expected values.
 *
 * @example Usage
 * ```ts
 * import { diff } from "@std/internal/diff";
 * import { assertEquals } from "@std/assert";
 *
 * const a = [1, 2, 3];
 * const b = [1, 2, 4];
 *
 * assertEquals(diff(a, b), [
 *   { type: "common", value: 1 },
 *   { type: "common", value: 2 },
 *   { type: "removed", value: 3 },
 *   { type: "added", value: 4 },
 * ]);
 * ```
 */
export function diff<T>(A: T[], B: T[]): DiffResult<T>[] {
  const prefixCommon = createCommon(A, B);
  A = A.slice(prefixCommon.length);
  B = B.slice(prefixCommon.length);
  const swapped = B.length > A.length;
  [A, B] = swapped ? [B, A] : [A, B];
  const M = A.length;
  const N = B.length;
  if (!M && !N && !prefixCommon.length) return [];
  if (!N) {
    return [
      ...prefixCommon.map((value) => ({ type: "common", value })),
      ...A.map((value) => ({ type: swapped ? "added" : "removed", value })),
    ] as DiffResult<T>[];
  }
  if (myersRoutesLength(M, N) > MAX_ROUTES_LENGTH) {
    return fallbackDiff(A, B, prefixCommon, swapped);
  }
  const offset = N;
  const delta = M - N;
  const length = M + N + 1;
  const fp: FarthestPoint[] = Array.from({ length }, () => ({ y: -1, id: -1 }));

  /**
   * Note: this buffer is used to save memory and improve performance. The first
   * half is used to save route and the last half is used to save diff type.
   */
  let routes: Uint32Array;
  try {
    routes = new Uint32Array((M * N + length + 1) * 2);
  } catch (error) {
    if (error instanceof RangeError) {
      return fallbackDiff(A, B, prefixCommon, swapped);
    }
    throw error;
  }
  const diffTypesPtrOffset = routes.length / 2;
  let ptr = 0;

  function snake<T>(
    k: number,
    A: T[],
    B: T[],
    slide?: FarthestPoint,
    down?: FarthestPoint,
  ): FarthestPoint {
    const M = A.length;
    const N = B.length;
    const fp = createFp(k, M, routes, diffTypesPtrOffset, ptr, slide, down);
    ptr = fp.id;
    while (fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]) {
      const prev = fp.id;
      ptr++;
      fp.id = ptr;
      fp.y += 1;
      routes[ptr] = prev;
      routes[ptr + diffTypesPtrOffset] = COMMON;
    }
    return fp;
  }

  let currentFp = fp[delta + offset];
  assertFp(currentFp);
  let p = -1;
  while (currentFp.y < N) {
    p = p + 1;
    for (let k = -p; k < delta; ++k) {
      const index = k + offset;
      fp[index] = snake(k, A, B, fp[index - 1], fp[index + 1]);
    }
    for (let k = delta + p; k > delta; --k) {
      const index = k + offset;
      fp[index] = snake(k, A, B, fp[index - 1], fp[index + 1]);
    }
    const index = delta + offset;
    fp[delta + offset] = snake(delta, A, B, fp[index - 1], fp[index + 1]);
    currentFp = fp[delta + offset];
    assertFp(currentFp);
  }
  return [
    ...prefixCommon.map((value) => ({ type: "common", value })),
    ...backTrace(A, B, currentFp, swapped, routes, diffTypesPtrOffset),
  ] as DiffResult<T>[];
}
