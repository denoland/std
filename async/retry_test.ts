// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { _exponentialBackoffWithJitter, retry } from "./retry.ts";
import { assertEquals, assertRejects } from "../testing/asserts.ts";

function generateErroringFunction(errorsBeforeSucceeds: number) {
  let errorCount = 0;

  return () => {
    if (errorCount >= errorsBeforeSucceeds) {
      return errorCount;
    }
    errorCount++;
    throw `Only errored ${errorCount} times`;
  };
}

Deno.test("[async] retry", async function () {
  const threeErrors = generateErroringFunction(3);
  const result = await retry(threeErrors, {
    minTimeout: 100,
  });
  assertEquals(result, 3);
});

Deno.test("[async] retry fails after max errors is passed", async function () {
  const fiveErrors = generateErroringFunction(5);
  await assertRejects(() =>
    retry(fiveErrors, {
      minTimeout: 100,
    })
  );
});

Deno.test(
  "[async] retry throws if minTimeout is less than maxTimeout",
  async function () {
    await assertRejects(() =>
      retry(() => {}, {
        minTimeout: 1000,
        maxTimeout: 100,
      })
    );
  },
);

Deno.test(
  "[async] retry throws if maxTimeout is less than 0",
  async function () {
    await assertRejects(() =>
      retry(() => {}, {
        maxTimeout: -1,
      })
    );
  },
);

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
  [69, 83, 56, 791, 131, 2140, 5480, 7706, 6036, 17908],
  [54, 16, 23, 381, 145, 2717, 3195, 4374, 3149, 21390],
  [32, 183, 334, 155, 391, 2954, 2890, 8202, 25202, 38387],
  [54, 89, 26, 174, 741, 1245, 1021, 12191, 19834, 17559],
  [74, 71, 113, 43, 496, 3196, 3843, 7860, 8943, 44312],
  [20, 129, 52, 555, 857, 3072, 3955, 7078, 5640, 1339],
  [75, 154, 59, 302, 998, 851, 5034, 8401, 23920, 41925],
  [86, 26, 211, 491, 139, 2263, 4502, 10713, 15976, 32328],
  [35, 10, 18, 449, 774, 698, 743, 8833, 24537, 7446],
  [11, 122, 178, 132, 573, 1803, 5107, 4505, 11523, 17598],
] as const;

Deno.test("[async] retry - backoff function timings", async (t) => {
  const originalMathRandom = Math.random;

  await t.step("_exponentialBackoffWithJitter", () => {
    let nextSeed = INITIAL_SEED;

    for (const row of expectedTimings) {
      const randUint32 = prngMulberry32(nextSeed);
      nextSeed = prngMulberry32(nextSeed)();
      Math.random = () => randUint32() / 0x100000000;

      const results: number[] = [];
      const base = 100;
      const cap = Infinity;

      for (let i = 0; i < 10; ++i) {
        const result = _exponentialBackoffWithJitter(cap, base, i, 2);
        results.push(Math.round(result));
      }

      assertEquals(results as typeof row, row);
    }
  });

  Math.random = originalMathRandom;
});
