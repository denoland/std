// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { exponentialBackoffWithJitter } from "./_util.ts";
import { assertEquals } from "../assert/mod.ts";

// test util to ensure deterministic results during testing of backoff function by polyfilling Math.random
function prngMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0);
  };
}

// random seed generated with crypto.getRandomValues(new Uint32Array(1))[0]
const INITIAL_SEED = 3460544849;

const expectedTimings: readonly (readonly number[] & { length: 10 })[] & {
  length: 10;
} = [
  [31, 117, 344, 9, 1469, 1060, 920, 5094, 19564, 33292],
  [46, 184, 377, 419, 1455, 483, 3205, 8426, 22451, 29810],
  [68, 17, 66, 645, 1209, 246, 3510, 4598, 398, 12813],
  [46, 111, 374, 626, 859, 1955, 5379, 609, 5766, 33641],
  [26, 129, 287, 757, 1104, 4, 2557, 4940, 16657, 6888],
  [80, 71, 348, 245, 743, 128, 2445, 5722, 19960, 49861],
  [25, 46, 341, 498, 602, 2349, 1366, 4399, 1680, 9275],
  [14, 174, 189, 309, 1461, 937, 1898, 2087, 9624, 18872],
  [65, 190, 382, 351, 826, 2502, 5657, 3967, 1063, 43754],
  [89, 78, 222, 668, 1027, 1397, 1293, 8295, 14077, 33602],
] as const;

Deno.test("exponentialBackoffWithJitter()", () => {
  let nextSeed = INITIAL_SEED;

  for (const row of expectedTimings) {
    const randUint32 = prngMulberry32(nextSeed);
    nextSeed = prngMulberry32(nextSeed)();
    Math.random = () => randUint32() / 0x100000000;

    const results: number[] = [];
    const base = 100;
    const cap = Infinity;

    for (let i = 0; i < 10; ++i) {
      const result = exponentialBackoffWithJitter(cap, base, i, 2, 1);
      results.push(Math.round(result));
    }

    assertEquals(results as typeof row, row);
  }
});
