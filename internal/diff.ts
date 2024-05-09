// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import type { DiffResult, DiffType } from "./_types.ts";

interface FarthestPoint {
  y: number;
  id: number;
}

const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;

/**
 * Creates an array of common elements between two arrays.
 *
 * @template T The type of elements in the arrays.
 *
 * @param A The first array.
 * @param B The second array.
 *
 * @returns An array containing the common elements between the two arrays.
 */
function createCommon<T>(A: T[], B: T[]): T[] {
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

function assertFp(value: unknown): asserts value is FarthestPoint {
  if (value === undefined) {
    throw new Error("Unexpected missing FarthestPoint");
  }
}

function backTrace<T>(
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
      result.unshift({
        type: swapped ? "removed" : "added",
        value: B[b]!,
      });
      b -= 1;
    } else if (type === ADDED) {
      result.unshift({
        type: swapped ? "added" : "removed",
        value: A[a]!,
      });
      a -= 1;
    } else {
      result.unshift({ type: "common", value: A[a]! });
      a -= 1;
      b -= 1;
    }
    j = routes[prev];
    type = routes[prev + diffTypesPtrOffset];
  }
  return result;
}

function createFp(
  slide: FarthestPoint | undefined,
  down: FarthestPoint | undefined,
  k: number,
  M: number,
  routes: Uint32Array,
  diffTypesPtrOffset: number,
  ptr: number,
): FarthestPoint {
  if (slide && slide.y === -1 && down && down.y === -1) {
    return { y: 0, id: 0 };
  }
  const isAdding = (down?.y === -1) ||
    k === M ||
    (slide?.y || 0) > (down?.y || 0) + 1;
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
 * Renders the differences between the actual and expected values
 * @param A Actual value
 * @param B Expected value
 */
export function diff<T>(A: T[], B: T[]): Array<DiffResult<T>> {
  const prefixCommon = createCommon(A, B);
  const suffixCommon = createCommon(
    A.slice(prefixCommon.length),
    B.slice(prefixCommon.length),
  );
  A = A.slice(prefixCommon.length, -suffixCommon.length || undefined);
  B = B.slice(prefixCommon.length, -suffixCommon.length || undefined);
  const swapped = B.length > A.length;
  [A, B] = swapped ? [B, A] : [A, B];
  const M = A.length;
  const N = B.length;
  if (!M && !N && !suffixCommon.length && !prefixCommon.length) return [];
  if (!N) {
    return [
      ...prefixCommon.map(
        (c): DiffResult<typeof c> => ({ type: "common", value: c }),
      ),
      ...A.map(
        (a): DiffResult<typeof a> => ({
          type: swapped ? "added" : "removed",
          value: a,
        }),
      ),
      ...suffixCommon.map(
        (c): DiffResult<typeof c> => ({ type: "common", value: c }),
      ),
    ];
  }
  const offset = N;
  const delta = M - N;
  const size = M + N + 1;
  const fp: FarthestPoint[] = Array.from(
    { length: size },
    () => ({ y: -1, id: -1 }),
  );

  /**
   * Note: this buffer is used to save memory and improve performance. The first
   * half is used to save route and the last half is used to save diff type.
   */
  const routes = new Uint32Array((M * N + size + 1) * 2);
  const diffTypesPtrOffset = routes.length / 2;
  let ptr = 0;
  let p = -1;

  function snake<T>(
    k: number,
    A: T[],
    B: T[],
    slide?: FarthestPoint,
    down?: FarthestPoint,
  ): FarthestPoint {
    const M = A.length;
    const N = B.length;
    if (k < -N || M < k) return { y: -1, id: -1 };
    const fp = createFp(slide, down, k, M, routes, diffTypesPtrOffset, ptr);
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
  while (currentFp.y < N) {
    p = p + 1;
    for (let k = -p; k < delta; ++k) {
      fp[k + offset] = snake(
        k,
        A,
        B,
        fp[k - 1 + offset],
        fp[k + 1 + offset],
      );
    }
    for (let k = delta + p; k > delta; --k) {
      fp[k + offset] = snake(k, A, B, fp[k - 1 + offset], fp[k + 1 + offset]);
    }
    fp[delta + offset] = snake(
      delta,
      A,
      B,
      fp[delta - 1 + offset],
      fp[delta + 1 + offset],
    );
    currentFp = fp[delta + offset];
    assertFp(currentFp);
  }
  return [
    ...prefixCommon.map(
      (c): DiffResult<typeof c> => ({ type: "common", value: c }),
    ),
    ...backTrace(A, B, currentFp, swapped, routes, diffTypesPtrOffset),
    ...suffixCommon.map(
      (c): DiffResult<typeof c> => ({ type: "common", value: c }),
    ),
  ];
}
